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
