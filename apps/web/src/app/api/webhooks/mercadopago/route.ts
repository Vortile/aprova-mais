import { NextResponse } from "next/server";
import crypto from "crypto";
import { getPayment } from "@/lib/mercadopago";
import { confirmarPagamentoEInscricao } from "@/lib/evento/confirm";

function isValidSignature(request: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  // No secret configured yet: allow through so early setup isn't blocked,
  // but the payment status itself is always re-fetched from Mercado Pago's
  // API below (never trusted from the webhook body), which limits the blast
  // radius of an unauthenticated notification.
  if (!secret) {
    return true;
  }

  if (!signatureHeader || !requestId) {
    return false;
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) {
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const queryDataId = url.searchParams.get("data.id");
  const payload = await request.json().catch(() => null);

  const paymentId: string | undefined =
    payload?.data?.id ?? queryDataId ?? undefined;

  if (!paymentId) {
    return NextResponse.json({ error: "missing_payment_id" }, { status: 400 });
  }

  if (!isValidSignature(request, String(paymentId))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  try {
    // Always re-fetch the payment from Mercado Pago directly — never trust
    // the webhook body's status, since anyone can POST to this endpoint.
    const payment = await getPayment(paymentId);
    const inscricaoId = payment.external_reference;

    if (!inscricaoId) {
      // Not one of our event payments (or missing reference) — acknowledge and ignore.
      return NextResponse.json({ ok: true });
    }

    if (payment.status === "approved") {
      await confirmarPagamentoEInscricao({
        inscricaoId,
        gatewayPaymentId: String(payment.id),
        formaPagamento:
          payment.payment_method_id === "pix" ? "pix" : "credit_card",
        valorPagoCentavos: Math.round(payment.transaction_amount * 100),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Mercado Pago webhook error:", err);
    return NextResponse.json({ error: "processing_error" }, { status: 500 });
  }
}

export async function GET() {
  // Mercado Pago pings the notification URL with GET to validate reachability.
  return NextResponse.json({ ok: true });
}
