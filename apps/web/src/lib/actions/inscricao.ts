"use server";

import { headers } from "next/headers";
import { TABLES } from "@repo/db";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  asSupabaseInsert,
  asSupabaseUpdate,
  asSupabaseRow,
} from "@/lib/supabase/typed";
import { inscricaoSchema } from "@/lib/validations/inscricao";
import { calculateAge, onlyDigits } from "@/lib/evento/format";
import { evento as eventoConfig } from "@/lib/evento/config";
import { getEventoStatus } from "@/lib/evento/queries";
import { confirmarPagamentoEInscricao } from "@/lib/evento/confirm";
import {
  createCardPayment,
  createPixPayment,
  type MercadoPagoPayer,
} from "@/lib/mercadopago";

async function getAppOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin;

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (host) return `${protocol}://${host}`;

  return process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3001";
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? fullName,
    lastName: parts.slice(1).join(" ") || parts[0] || fullName,
  };
}

export type EventoAnalyticsInput = {
  sessionId: string;
  tipoEvento:
    | "page_view"
    | "cta_click"
    | "form_started"
    | "form_submitted"
    | "pix_generated"
    | "card_started";
  inscricaoId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
};

export async function trackEventoAction(input: EventoAnalyticsInput) {
  const supabase = createAdminClient();

  await supabase.from(TABLES.EVENTO_ANALYTICS).insert(
    asSupabaseInsert<"evento_analytics">({
      evento_slug: eventoConfig.slug,
      tipo_evento: input.tipoEvento,
      session_id: input.sessionId,
      inscricao_id: input.inscricaoId ?? null,
      utm_source: input.utmSource || null,
      utm_medium: input.utmMedium || null,
      utm_campaign: input.utmCampaign || null,
      referrer: input.referrer || null,
    }),
  );

  return { ok: true } as const;
}

type ActionResult<T> = ({ ok: true } & T) | { ok: false; error: string };

export async function criarInscricaoAction(
  raw: unknown,
  sessionId: string,
): Promise<ActionResult<{ inscricaoId: string }>> {
  const parsed = inscricaoSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const values = parsed.data;
  const status = await getEventoStatus();

  if (!status || !status.ativo) {
    return {
      ok: false,
      error: "As inscrições para este evento estão encerradas.",
    };
  }

  if (status.esgotado) {
    return {
      ok: false,
      error: "Vagas esgotadas! As 26 vagas do Intensivão já foram preenchidas.",
    };
  }

  const idade = calculateAge(values.dataNascimento);
  if (idade === null) {
    return { ok: false, error: "Data de nascimento inválida." };
  }

  const supabase = createAdminClient();

  const { data: insertedData, error } = await supabase
    .from(TABLES.EVENTO_INSCRICOES)
    .insert(
      asSupabaseInsert<"evento_inscricoes">({
        evento_id: status.eventoId,
        session_id: sessionId,
        nome_aluno: values.nomeAluno,
        email_aluno: values.emailAluno,
        whatsapp_aluno: onlyDigits(values.whatsappAluno),
        cpf_aluno: onlyDigits(values.cpfAluno),
        data_nascimento: values.dataNascimento,
        idade_aluno: idade,
        serie_atual: values.serieAtual,
        nome_responsavel: values.nomeResponsavel || null,
        whatsapp_responsavel: values.whatsappResponsavel
          ? onlyDigits(values.whatsappResponsavel)
          : null,
        restricoes_medicas: values.restricoesMedicas || null,
        valor_pago_centavos: status.precoCentavos,
        utm_source: values.utmSource || null,
        utm_medium: values.utmMedium || null,
        utm_campaign: values.utmCampaign || null,
      }),
    )
    .select("id")
    .single();

  const data = asSupabaseRow<"evento_inscricoes">(insertedData);

  if (error || !data) {
    console.error("criarInscricaoAction error:", error);
    return {
      ok: false,
      error: "Não foi possível registrar sua inscrição. Tente novamente.",
    };
  }

  return { ok: true, inscricaoId: data.id };
}

async function getInscricaoOrFail(inscricaoId: string) {
  const supabase = createAdminClient();
  const { data: rawData, error } = await supabase
    .from(TABLES.EVENTO_INSCRICOES)
    .select("*")
    .eq("id", inscricaoId)
    .single();

  const data = asSupabaseRow<"evento_inscricoes">(rawData);

  if (error || !data) {
    return null;
  }

  return data;
}

export async function gerarPixAction(
  inscricaoId: string,
): Promise<
  ActionResult<{ qrCode: string; qrCodeBase64: string; paymentId: number }>
> {
  const inscricao = await getInscricaoOrFail(inscricaoId);
  if (!inscricao) {
    return { ok: false, error: "Inscrição não encontrada." };
  }
  if (inscricao.status_pagamento === "aprovado") {
    return { ok: false, error: "Este ingresso já foi pago." };
  }

  const status = await getEventoStatus();
  if (!status || status.esgotado) {
    return {
      ok: false,
      error: "Vagas esgotadas! As 26 vagas já foram preenchidas.",
    };
  }

  const { firstName, lastName } = splitName(inscricao.nome_aluno);
  const payer: MercadoPagoPayer = {
    email: inscricao.email_aluno,
    first_name: firstName,
    last_name: lastName,
    identification: { type: "CPF", number: inscricao.cpf_aluno },
  };

  try {
    const origin = await getAppOrigin();
    const payment = await createPixPayment({
      inscricaoId,
      valorReais: inscricao.valor_pago_centavos / 100,
      descricao: eventoConfig.titulo,
      payer,
      notificationUrl: `${origin}/api/webhooks/mercadopago`,
    });

    const supabase = createAdminClient();
    await supabase
      .from(TABLES.EVENTO_INSCRICOES)
      .update(
        asSupabaseUpdate<"evento_inscricoes">({
          gateway_payment_id: String(payment.id),
          forma_pagamento: "pix",
        }),
      )
      .eq("id", inscricaoId);

    const qrCode = payment.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 =
      payment.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCode || !qrCodeBase64) {
      return {
        ok: false,
        error: "O Mercado Pago não retornou o QR Code do PIX.",
      };
    }

    return { ok: true, qrCode, qrCodeBase64, paymentId: payment.id };
  } catch (err) {
    console.error("gerarPixAction error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao gerar o PIX.",
    };
  }
}

export async function processarCartaoAction(input: {
  inscricaoId: string;
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
}): Promise<ActionResult<{ status: "approved" | "in_process" }>> {
  const inscricao = await getInscricaoOrFail(input.inscricaoId);
  if (!inscricao) {
    return { ok: false, error: "Inscrição não encontrada." };
  }
  if (inscricao.status_pagamento === "aprovado") {
    return { ok: false, error: "Este ingresso já foi pago." };
  }

  const status = await getEventoStatus();
  if (!status || status.esgotado) {
    return {
      ok: false,
      error: "Vagas esgotadas! As 26 vagas já foram preenchidas.",
    };
  }

  try {
    const origin = await getAppOrigin();
    const payment = await createCardPayment({
      inscricaoId: input.inscricaoId,
      valorReais: inscricao.valor_pago_centavos / 100,
      descricao: eventoConfig.titulo,
      token: input.token,
      installments: input.installments,
      paymentMethodId: input.paymentMethodId,
      issuerId: input.issuerId,
      payer: {
        email: inscricao.email_aluno,
        identification: { type: "CPF", number: inscricao.cpf_aluno },
      },
      notificationUrl: `${origin}/api/webhooks/mercadopago`,
    });

    const supabase = createAdminClient();
    await supabase
      .from(TABLES.EVENTO_INSCRICOES)
      .update(
        asSupabaseUpdate<"evento_inscricoes">({
          gateway_payment_id: String(payment.id),
          forma_pagamento: "credit_card",
        }),
      )
      .eq("id", input.inscricaoId);

    if (payment.status === "rejected" || payment.status === "cancelled") {
      return {
        ok: false,
        error:
          "Pagamento recusado pela operadora do cartão. Tente outro cartão ou use o PIX.",
      };
    }

    if (payment.status === "approved") {
      await confirmarPagamentoEInscricao({
        inscricaoId: input.inscricaoId,
        gatewayPaymentId: String(payment.id),
        formaPagamento: "credit_card",
        valorPagoCentavos: Math.round(payment.transaction_amount * 100),
      });
      return { ok: true, status: "approved" };
    }

    return { ok: true, status: "in_process" };
  } catch (err) {
    console.error("processarCartaoAction error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao processar o cartão.",
    };
  }
}

export async function consultarStatusInscricaoAction(inscricaoId: string) {
  const inscricao = await getInscricaoOrFail(inscricaoId);
  if (!inscricao) {
    return { ok: false, error: "Inscrição não encontrada." } as const;
  }

  return {
    ok: true,
    statusPagamento: inscricao.status_pagamento,
    turmaAlocada: inscricao.turma_alocada,
    horarioTurma: inscricao.horario_turma,
    numeroConfirmacao: inscricao.numero_confirmacao,
    codigoIngresso: inscricao.codigo_ingresso,
  } as const;
}
