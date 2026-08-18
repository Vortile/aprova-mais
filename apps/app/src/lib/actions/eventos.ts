"use server";

import { revalidatePath } from "next/cache";
import { TABLES, type Database } from "@repo/db";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/supabase/env";
import {
  asSupabaseInsert,
  asSupabaseUpdate,
  asSupabaseRow,
  asSupabaseRows,
} from "@/lib/supabase/typed";
import { ROUTES } from "@/lib/routes";

type EventoRow = Database["public"]["Tables"]["eventos"]["Row"];
type InscricaoRow = Database["public"]["Tables"]["evento_inscricoes"]["Row"];

async function assertAdminSession() {
  const session = await getCurrentAppSession();
  if (!session || session.profile.role !== ROLES.ADMIN) {
    throw new Error(
      "Acesso negado. Apenas administradores podem gerenciar eventos.",
    );
  }
  return session;
}

export type EventoFunilStats = {
  pageViews: number;
  ctaClicks: number;
  formStarted: number;
  formSubmitted: number;
  pixGenerated: number;
  cardStarted: number;
  paymentApproved: number;
};

export type EventoDashboardData = {
  evento: EventoRow;
  inscricoes: InscricaoRow[];
  funil: EventoFunilStats;
  vagasConfirmadas: number;
  faturamentoBrutoCentavos: number;
  turma1Ocupadas: number;
  turma2Ocupadas: number;
};

export async function getEventoDashboardData(
  slug: string,
): Promise<EventoDashboardData | null> {
  await assertAdminSession();
  const supabase = createAdminClient();

  const { data: eventoData } = await supabase
    .from(TABLES.EVENTOS)
    .select("*")
    .eq("slug", slug)
    .single();

  const evento = asSupabaseRow<"eventos">(eventoData);

  if (!evento) {
    return null;
  }

  const [{ data: inscricoesData }, { data: analyticsData }] = await Promise.all(
    [
      supabase
        .from(TABLES.EVENTO_INSCRICOES)
        .select("*")
        .eq("evento_id", evento.id)
        .order("created_at", { ascending: false }),
      supabase
        .from(TABLES.EVENTO_ANALYTICS)
        .select("tipo_evento, session_id")
        .eq("evento_slug", slug),
    ],
  );

  const inscricoes = asSupabaseRows<"evento_inscricoes">(inscricoesData);
  const analyticsRows = analyticsData as
    | Pick<
        Database["public"]["Tables"]["evento_analytics"]["Row"],
        "tipo_evento" | "session_id"
      >[]
    | null;

  const uniqueSessionsFor = (tipo: string) =>
    new Set(
      (analyticsRows ?? [])
        .filter((row) => row.tipo_evento === tipo)
        .map((row) => row.session_id),
    ).size;

  const funil: EventoFunilStats = {
    pageViews: uniqueSessionsFor("page_view"),
    ctaClicks: uniqueSessionsFor("cta_click"),
    formStarted: uniqueSessionsFor("form_started"),
    formSubmitted: uniqueSessionsFor("form_submitted"),
    pixGenerated: uniqueSessionsFor("pix_generated"),
    cardStarted: uniqueSessionsFor("card_started"),
    paymentApproved: uniqueSessionsFor("payment_approved"),
  };

  const allInscricoes = inscricoes ?? [];
  const aprovados = allInscricoes.filter(
    (row) => row.status_pagamento === "aprovado",
  );
  const faturamentoBrutoCentavos = aprovados.reduce(
    (sum, row) => sum + row.valor_pago_centavos,
    0,
  );

  return {
    evento,
    inscricoes: allInscricoes,
    funil,
    vagasConfirmadas: aprovados.length,
    faturamentoBrutoCentavos,
    turma1Ocupadas: Math.min(aprovados.length, evento.capacidade_por_turma),
    turma2Ocupadas: Math.max(0, aprovados.length - evento.capacidade_por_turma),
  };
}

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function registrarCheckinAction(
  inscricaoId: string,
  diaNumero: 1 | 2 | 3 | 4,
): Promise<ActionResult> {
  const session = await assertAdminSession();
  const supabase = createAdminClient();

  const { error } = await supabase.from(TABLES.EVENTO_CHECKINS).upsert(
    asSupabaseInsert<"evento_checkins">({
      inscricao_id: inscricaoId,
      dia_numero: diaNumero,
      validado_por: session.profile.id,
    }),
    { onConflict: "inscricao_id,dia_numero" },
  );

  if (error) {
    return { ok: false, error: "Não foi possível registrar o check-in." };
  }

  revalidatePath(ROUTES.ADMIN.EVENTOS);
  return { ok: true, message: `Check-in do dia ${diaNumero} registrado.` };
}

export async function reenviarIngressoAction(
  inscricaoId: string,
): Promise<ActionResult> {
  await assertAdminSession();

  const webAppUrl = process.env.WEB_APP_URL;
  const internalSecret = process.env.INTERNAL_ADMIN_SECRET;

  if (!webAppUrl || !internalSecret) {
    return {
      ok: false,
      error: "WEB_APP_URL / INTERNAL_ADMIN_SECRET não configurados.",
    };
  }

  try {
    const response = await fetch(
      `${webAppUrl}/api/internal/reenviar-ingresso`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": internalSecret,
        },
        body: JSON.stringify({ inscricaoId }),
      },
    );

    if (!response.ok) {
      return { ok: false, error: "Falha ao reenviar o ingresso." };
    }

    return { ok: true, message: "Ingresso reenviado com sucesso." };
  } catch (err) {
    console.error("reenviarIngressoAction error:", err);
    return { ok: false, error: "Falha ao reenviar o ingresso." };
  }
}

export async function atualizarDatasEventoAction(
  eventoId: string,
  datas: {
    sabado1: string;
    sabado2: string;
    sabado3: string;
    sabado4: string;
    horarioGeral: string;
    salaTurma1: string;
    salaTurma2: string;
  },
): Promise<ActionResult> {
  await assertAdminSession();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from(TABLES.EVENTOS)
    .update(
      asSupabaseUpdate<"eventos">({
        data_sabado_1: datas.sabado1 || null,
        data_sabado_2: datas.sabado2 || null,
        data_sabado_3: datas.sabado3 || null,
        data_sabado_4: datas.sabado4 || null,
        horario_geral: datas.horarioGeral || null,
        sala_turma_1: datas.salaTurma1 || null,
        sala_turma_2: datas.salaTurma2 || null,
      }),
    )
    .eq("id", eventoId);

  if (error) {
    return { ok: false, error: "Não foi possível atualizar as datas." };
  }

  revalidatePath(ROUTES.ADMIN.EVENTOS);
  return { ok: true, message: "Datas atualizadas com sucesso." };
}

export async function enviarPreviewEmailAction(input: {
  to: string;
  emailType: "ticket" | "all" | string;
  apiKeyOverride?: string;
  nomeAluno?: string;
  turma?: 1 | 2;
}): Promise<ActionResult> {
  await assertAdminSession();

  const {
    to,
    emailType,
    apiKeyOverride,
    nomeAluno = "Luciano Simoni",
    turma = 1,
  } = input;

  if (!to || !to.includes("@")) {
    return { ok: false, error: "Informe um endereço de e-mail válido." };
  }

  const apiKey = apiKeyOverride || process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY não configurada. Por favor, forneça uma chave válida do Resend (re_...).",
    };
  }

  try {
    const { Resend } = await import("resend");
    const QRCode = (await import("qrcode")).default;
    const { generateTicketEmailHtml } =
      await import("@/lib/email/ticket-template");
    const { generateDripEmailHtml, DRIP_EMAIL_LABELS } =
      await import("@/lib/email/drip-templates");
    type DripEmailType = Parameters<typeof generateDripEmailHtml>[0]["tipo"];
    const { evento: eventoConfig } = await import("@/lib/evento/config");

    const resend = new Resend(apiKey);
    const fromEmail = "Aprova+ Eventos <contato@aprovamaiscurso-pro.com.br>";

    const mockInscricao: InscricaoRow = {
      id: "preview-test-uuid",
      evento_id: "evt-preview-uuid",
      numero_inscricao: 1,
      session_id: "sess-preview",
      nome_aluno: nomeAluno,
      email_aluno: to,
      whatsapp_aluno: "92981581955",
      cpf_aluno: "00011122233",
      data_nascimento: "2006-08-18",
      idade_aluno: 19,
      serie_atual: "concluido",
      nome_responsavel: null,
      whatsapp_responsavel: null,
      restricoes_medicas: null,
      status_pagamento: "aprovado",
      forma_pagamento: "pix",
      gateway: "mercadopago",
      gateway_payment_id: "mp-123456789",
      numero_confirmacao: turma === 1 ? 1 : 14,
      turma_alocada: turma,
      horario_turma:
        turma === 1 ? eventoConfig.horarioTurma1 : eventoConfig.horarioTurma2,
      sala_alocada:
        turma === 1 ? eventoConfig.salaTurma1 : eventoConfig.salaTurma2,
      codigo_ingresso: "APROVA-MED-TESTE-2026",
      valor_pago_centavos: 50000,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      created_at: new Date().toISOString(),
      pago_em: new Date().toISOString(),
    };

    if (emailType === "all") {
      const qrBuffer = await QRCode.toBuffer(mockInscricao.codigo_ingresso, {
        width: 320,
        margin: 1,
      });

      const ticketHtml = generateTicketEmailHtml({
        inscricao: mockInscricao,
        evento: {
          data_sabado_1: "2026-09-12",
          data_sabado_2: "2026-09-19",
          data_sabado_3: "2026-09-26",
          data_sabado_4: "2026-10-03",
        },
      });

      const ticketRes = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: `[PREVIEW 1/9] 🎟️ Seu Ingresso — Intensivão ENEM 2026 (Foco Medicina)`,
        html: ticketHtml,
        attachments: [
          {
            filename: "ingresso-qrcode.png",
            content: qrBuffer.toString("base64"),
            contentId: "ticket-qrcode",
            contentType: "image/png",
          },
        ],
      });

      if (ticketRes.error) {
        return {
          ok: false,
          error: `Erro no Resend (Ingresso): ${ticketRes.error.message}`,
        };
      }

      const dripKeys: DripEmailType[] = [
        "guia_preparacao",
        "mensagem_professor",
        "mapa_tri",
        "checklist_evento",
        "devolutiva_dia1",
        "devolutiva_dia2",
        "devolutiva_dia3",
        "pos_evento",
      ];

      let counter = 2;
      for (const tipo of dripKeys) {
        const drip = generateDripEmailHtml({
          tipo,
          nomeAluno,
          turma,
          sala: turma === 1 ? eventoConfig.salaTurma1 : eventoConfig.salaTurma2,
          horario:
            turma === 1
              ? eventoConfig.horarioTurma1
              : eventoConfig.horarioTurma2,
        });

        const res = await resend.emails.send({
          from: fromEmail,
          to: [to],
          subject: `[PREVIEW ${counter}/9] ${drip.subject}`,
          html: drip.html,
        });

        if (res.error) {
          return {
            ok: false,
            error: `Erro no Resend (${DRIP_EMAIL_LABELS[tipo].title}): ${res.error.message}`,
          };
        }

        counter++;
        await new Promise((r) => setTimeout(r, 400));
      }

      return {
        ok: true,
        message: `Todos os 9 e-mails de preview foram enviados para ${to}!`,
      };
    }

    if (emailType === "ticket") {
      const qrBuffer = await QRCode.toBuffer(mockInscricao.codigo_ingresso, {
        width: 320,
        margin: 1,
      });

      const ticketHtml = generateTicketEmailHtml({
        inscricao: mockInscricao,
        evento: {
          data_sabado_1: "2026-09-12",
          data_sabado_2: "2026-09-19",
          data_sabado_3: "2026-09-26",
          data_sabado_4: "2026-10-03",
        },
      });

      const res = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: `[TESTE] 🎟️ Seu Ingresso — ${eventoConfig.titulo}`,
        html: ticketHtml,
        attachments: [
          {
            filename: "ingresso-qrcode.png",
            content: qrBuffer.toString("base64"),
            contentId: "ticket-qrcode",
            contentType: "image/png",
          },
        ],
      });

      if (res.error) {
        return { ok: false, error: res.error.message };
      }

      return { ok: true, message: `Ingresso de teste enviado para ${to}!` };
    }

    // Single Drip email
    const drip = generateDripEmailHtml({
      tipo: emailType as DripEmailType,
      nomeAluno,
      turma,
      sala: turma === 1 ? eventoConfig.salaTurma1 : eventoConfig.salaTurma2,
      horario:
        turma === 1 ? eventoConfig.horarioTurma1 : eventoConfig.horarioTurma2,
    });

    const res = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `[TESTE] ${drip.subject}`,
      html: drip.html,
    });

    if (res.error) {
      return { ok: false, error: res.error.message };
    }

    return {
      ok: true,
      message: `E-mail de teste (${emailType}) enviado para ${to}!`,
    };
  } catch (err) {
    console.error("enviarPreviewEmailAction error:", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao disparar e-mail.",
    };
  }
}
