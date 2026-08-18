import { NextResponse } from "next/server";
import { TABLES } from "@repo/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseRow } from "@/lib/supabase/typed";
import { sendTicketEmail } from "@/lib/email/ticket-email";

/**
 * Internal-only endpoint used by the admin dashboard (apps/app) to
 * re-send a participant's ticket e-mail. Protected by a shared secret
 * header instead of a user session, since it's called server-to-server.
 */
export async function POST(request: Request) {
  const secret = process.env.INTERNAL_ADMIN_SECRET;
  const providedSecret = request.headers.get("x-internal-secret");

  if (!secret || providedSecret !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const inscricaoId = body?.inscricaoId;

  if (!inscricaoId || typeof inscricaoId !== "string") {
    return NextResponse.json(
      { error: "missing_inscricao_id" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: inscricaoData, error } = await supabase
    .from(TABLES.EVENTO_INSCRICOES)
    .select("*")
    .eq("id", inscricaoId)
    .single();

  const inscricao = asSupabaseRow<"evento_inscricoes">(inscricaoData);

  if (error || !inscricao) {
    return NextResponse.json({ error: "inscricao_not_found" }, { status: 404 });
  }

  if (inscricao.status_pagamento !== "aprovado") {
    return NextResponse.json({ error: "inscricao_not_paid" }, { status: 409 });
  }

  try {
    const { data: eventoRowData } = await supabase
      .from(TABLES.EVENTOS)
      .select("data_sabado_1, data_sabado_2, data_sabado_3, data_sabado_4")
      .eq("id", inscricao.evento_id)
      .single();

    await sendTicketEmail(inscricao, asSupabaseRow<"eventos">(eventoRowData));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reenviar-ingresso error:", err);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
