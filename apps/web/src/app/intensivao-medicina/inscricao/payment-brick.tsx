"use client";

import { useEffect, useRef } from "react";
import { gerarPixAction, processarCartaoAction } from "@/lib/actions/inscricao";

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => {
      bricks: () => {
        create: (
          type: "payment",
          containerId: string,
          settings: Record<string, unknown>,
        ) => Promise<{ unmount: () => void }>;
      };
    };
  }
}

type PaymentFormData = {
  token?: string;
  installments?: number;
  payment_method_id: string;
  issuer_id?: string;
};

type PaymentSubmitParams = {
  selectedPaymentMethod: string;
  formData: PaymentFormData;
};

export type PixResult = { qrCode: string; qrCodeBase64: string };

let sdkLoadPromise: Promise<void> | null = null;

function loadMercadoPagoSdk() {
  if (typeof window !== "undefined" && window.MercadoPago) {
    return Promise.resolve();
  }

  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Não foi possível carregar o Mercado Pago."));
      document.body.appendChild(script);
    });
  }

  return sdkLoadPromise;
}

/**
 * Single Mercado Pago Payment Brick handling both PIX and Credit Card.
 * PIX submissions resolve with the QR Code (rendered by us); card
 * submissions are processed and, once approved, `onCardApproved` fires.
 */
export function PaymentBrick({
  inscricaoId,
  amount,
  payerEmail,
  payerCpf,
  onPixGenerated,
  onCardApproved,
  onError,
}: {
  inscricaoId: string;
  amount: number;
  payerEmail: string;
  payerCpf: string;
  onPixGenerated: (pix: PixResult) => void;
  onCardApproved: () => void;
  onError: (message: string) => void;
}) {
  const containerId = "evento-payment-brick";
  const brickRef = useRef<{ unmount: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function mountBrick() {
      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
      if (!publicKey) {
        onError("Pagamento indisponível no momento.");
        return;
      }

      try {
        await loadMercadoPagoSdk();
      } catch (err) {
        onError(
          err instanceof Error ? err.message : "Erro ao carregar o pagamento.",
        );
        return;
      }

      if (cancelled || !window.MercadoPago) return;

      const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });

      brickRef.current = await mp.bricks().create("payment", containerId, {
        initialization: {
          amount,
          payer: {
            email: payerEmail,
            identification: { type: "CPF", number: payerCpf },
          },
        },
        customization: {
          paymentMethods: {
            creditCard: "all",
            bankTransfer: "all",
            maxInstallments: 12,
          },
        },
        callbacks: {
          onSubmit: ({
            selectedPaymentMethod,
            formData,
          }: PaymentSubmitParams) =>
            new Promise<void>((resolve, reject) => {
              if (selectedPaymentMethod === "bank_transfer") {
                gerarPixAction(inscricaoId)
                  .then((result) => {
                    if (!result.ok) {
                      onError(result.error);
                      reject(new Error(result.error));
                      return;
                    }
                    resolve();
                    onPixGenerated({
                      qrCode: result.qrCode,
                      qrCodeBase64: result.qrCodeBase64,
                    });
                  })
                  .catch((err) => {
                    const message =
                      err instanceof Error
                        ? err.message
                        : "Erro ao gerar o PIX.";
                    onError(message);
                    reject(err);
                  });
                return;
              }

              processarCartaoAction({
                inscricaoId,
                token: formData.token ?? "",
                installments: formData.installments ?? 1,
                paymentMethodId: formData.payment_method_id,
                issuerId: formData.issuer_id,
              })
                .then((result) => {
                  if (!result.ok) {
                    onError(result.error);
                    reject(new Error(result.error));
                    return;
                  }
                  resolve();
                  onCardApproved();
                })
                .catch((err) => {
                  const message =
                    err instanceof Error
                      ? err.message
                      : "Erro ao processar o pagamento.";
                  onError(message);
                  reject(err);
                });
            }),
          onError: (error: unknown) => {
            console.error("Mercado Pago Brick error:", error);
          },
        },
      });
    }

    mountBrick();

    return () => {
      cancelled = true;
      brickRef.current?.unmount();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inscricaoId, amount, payerEmail, payerCpf]);

  return <div id={containerId} />;
}
