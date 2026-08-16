import { NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago";
import { confirmarPagamentoEInscricao } from "@/lib/evento/confirm";
import { isValidMercadoPagoSignature } from "@/lib/evento/webhook-signature";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const queryDataId = url.searchParams.get("data.id");
  const payload = await request.json().catch(() => null);

  const paymentId: string | undefined =
    payload?.data?.id ?? queryDataId ?? undefined;

  if (!paymentId) {
    return NextResponse.json({ error: "missing_payment_id" }, { status: 400 });
  }

  if (
    !isValidMercadoPagoSignature({
      secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      signatureHeader: request.headers.get("x-signature"),
      requestId: request.headers.get("x-request-id"),
      dataId: String(paymentId),
    })
  ) {
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
