import { NextResponse } from "next/server";
import { TABLES } from "@repo/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseInsert, asSupabaseRows } from "@/lib/supabase/typed";
import { sendDripEmail } from "@/lib/email/evento-drip";
import { computeDripSchedule } from "@/lib/email/drip-schedule";

/**
 * Daily drip campaign for confirmed event registrations. Triggered by a
 * Vercel Cron job (see vercel.json) and protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const { data: eventosData } = await supabase
    .from(TABLES.EVENTOS)
    .select("*")
    .eq("ativo", true);

  const eventos = asSupabaseRows<"eventos">(eventosData);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalSent = 0;
  const errors: string[] = [];

  for (const evento of eventos ?? []) {
    const { data: inscricoesData } = await supabase
      .from(TABLES.EVENTO_INSCRICOES)
      .select("*")
      .eq("evento_id", evento.id)
      .eq("status_pagamento", "aprovado");

    const inscricoes = asSupabaseRows<"evento_inscricoes">(inscricoesData);

    if (!inscricoes || inscricoes.length === 0) {
      continue;
    }

    const { data: logsData } = await supabase
      .from(TABLES.EVENTO_EMAIL_LOG)
      .select("inscricao_id, tipo_email")
      .in(
        "inscricao_id",
        inscricoes.map((row) => row.id),
      );

    const logs = asSupabaseRows<"evento_email_log">(logsData);

    const sentSet = new Set(
      (logs ?? []).map((log) => `${log.inscricao_id}:${log.tipo_email}`),
    );

    for (const inscricao of inscricoes) {
      const schedule = computeDripSchedule(inscricao, evento);

      for (const item of schedule) {
        const key = `${inscricao.id}:${item.tipo}`;
        if (sentSet.has(key) || item.targetDate > today) {
          continue;
        }

        try {
          await sendDripEmail(item.tipo, inscricao, evento);
          await supabase.from(TABLES.EVENTO_EMAIL_LOG).insert(
            asSupabaseInsert<"evento_email_log">({
              inscricao_id: inscricao.id,
              tipo_email: item.tipo,
            }),
          );
          totalSent += 1;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(
            `Failed to send drip email ${item.tipo} to ${inscricao.email_aluno}:`,
            err,
          );
          errors.push(`${inscricao.id}:${item.tipo} — ${message}`);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, errors });
}
