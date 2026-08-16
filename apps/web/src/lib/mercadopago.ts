import "server-only";

// Thin wrapper around the Mercado Pago Payments API (Checkout Transparente).
// We call the REST API directly with fetch to avoid SDK version drift —
// the `/v1/payments` contract is stable and fully documented by Mercado Pago.

const MP_API_BASE = "https://api.mercadopago.com";

function getAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não está configurada.");
  }
  return token;
}

export type MercadoPagoIdentification = {
  type: "CPF";
  number: string;
};

export type MercadoPagoPayer = {
  email: string;
  first_name?: string;
  last_name?: string;
  identification: MercadoPagoIdentification;
};

export type MercadoPagoPayment = {
  id: number;
  status:
    | "pending"
    | "approved"
    | "authorized"
    | "in_process"
    | "in_mediation"
    | "rejected"
    | "cancelled"
    | "refunded"
    | "charged_back";
  status_detail: string;
  transaction_amount: number;
  payment_method_id: string;
  external_reference: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

async function mercadoPagoFetch(
  path: string,
  init: RequestInit & { idempotencyKey?: string },
): Promise<MercadoPagoPayment> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
  };

  if (init.idempotencyKey) {
    headers["X-Idempotency-Key"] = init.idempotencyKey;
  }

  const response = await fetch(`${MP_API_BASE}${path}`, {
    ...init,
    headers,
  });

  const body = await response.json();

  if (!response.ok) {
    console.error("Mercado Pago API error:", JSON.stringify(body));
    const message =
      body?.message || body?.cause?.[0]?.description || "Erro no Mercado Pago";
    throw new Error(message);
  }

  return body as MercadoPagoPayment;
}

/**
 * Creates a PIX payment. Mercado Pago returns a ready-to-use QR code
 * (copia e cola + base64 image) inside `point_of_interaction`.
 */
export async function createPixPayment(params: {
  inscricaoId: string;
  valorReais: number;
  descricao: string;
  payer: MercadoPagoPayer;
  notificationUrl: string;
}) {
  return mercadoPagoFetch("/v1/payments", {
    method: "POST",
    idempotencyKey: `pix-${params.inscricaoId}`,
    body: JSON.stringify({
      transaction_amount: params.valorReais,
      description: params.descricao,
      payment_method_id: "pix",
      payer: params.payer,
      external_reference: params.inscricaoId,
      notification_url: params.notificationUrl,
    }),
  });
}

/**
 * Creates a credit card payment from a card token generated client-side
 * by the Mercado Pago.js Card Payment Brick (PCI-safe tokenization).
 */
export async function createCardPayment(params: {
  inscricaoId: string;
  valorReais: number;
  descricao: string;
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
  payer: MercadoPagoPayer;
  notificationUrl: string;
}) {
  return mercadoPagoFetch("/v1/payments", {
    method: "POST",
    idempotencyKey: `card-${params.inscricaoId}`,
    body: JSON.stringify({
      transaction_amount: params.valorReais,
      description: params.descricao,
      token: params.token,
      installments: params.installments,
      payment_method_id: params.paymentMethodId,
      issuer_id: params.issuerId,
      payer: params.payer,
      external_reference: params.inscricaoId,
      notification_url: params.notificationUrl,
    }),
  });
}

export async function getPayment(paymentId: string | number) {
  return mercadoPagoFetch(`/v1/payments/${paymentId}`, { method: "GET" });
}
