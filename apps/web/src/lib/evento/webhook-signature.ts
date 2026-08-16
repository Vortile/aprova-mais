import crypto from "crypto";

/**
 * Validates Mercado Pago's webhook HMAC signature.
 * https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks
 *
 * Pure function (no Request/env access) so it's trivial to unit test.
 * If `secret` is undefined, validation is skipped (returns true) — the
 * caller must always re-fetch the payment from Mercado Pago's API before
 * trusting anything, which limits the blast radius of an unsigned request.
 */
export function isValidMercadoPagoSignature(params: {
  secret: string | undefined;
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string;
}): boolean {
  const { secret, signatureHeader, requestId, dataId } = params;

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

  if (computed.length !== v1.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
  } catch {
    return false;
  }
}
