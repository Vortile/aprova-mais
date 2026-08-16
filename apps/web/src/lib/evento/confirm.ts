import "server-only";

import { TABLES } from "@repo/db";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  asSupabaseInsert,
  asSupabaseUpdate,
  asSupabaseRow,
  type TableRow,
} from "@/lib/supabase/typed";
import { sendTicketEmail } from "@/lib/email/ticket-email";
import { evento as eventoConfig } from "@/lib/evento/config";

type Inscricao = TableRow<"evento_inscricoes">;

/**
 * Confirms a payment via the atomic `confirmar_pagamento_evento` Postgres
 * function (which allocates the turma and enforces the 26-seat limit),
 * then sends the ticket e-mail exactly once. Safe to call multiple times
 * for the same payment (Mercado Pago webhooks can retry notifications).
 */
export async function confirmarPagamentoEInscricao(params: {
  inscricaoId: string;
  gatewayPaymentId: string;
  formaPagamento: "pix" | "credit_card";
  valorPagoCentavos: number;
}): Promise<Inscricao> {
  const supabase = createAdminClient();

  const { data: rpcData, error } = await supabase.rpc(
    "confirmar_pagamento_evento",
    {
      p_inscricao_id: params.inscricaoId,
      p_gateway_payment_id: params.gatewayPaymentId,
      p_forma_pagamento: params.formaPagamento,
      p_valor_pago_centavos: params.valorPagoCentavos,
    } as never,
  );

  const data = rpcData as unknown as Inscricao | null;

  if (error || !data) {
    if (error?.message?.includes("vagas_esgotadas")) {
      await supabase
        .from(TABLES.EVENTO_INSCRICOES)
        .update(
          asSupabaseUpdate<"evento_inscricoes">({
            status_pagamento: "cancelado",
          }),
        )
        .eq("id", params.inscricaoId);
    }
    throw new Error(error?.message ?? "Falha ao confirmar pagamento.");
  }

  const inscricao = data;

  if (inscricao.session_id) {
    await supabase.from(TABLES.EVENTO_ANALYTICS).insert(
      asSupabaseInsert<"evento_analytics">({
        evento_slug: eventoConfig.slug,
        tipo_evento: "payment_approved",
        session_id: inscricao.session_id,
        inscricao_id: inscricao.id,
      }),
    );
  }

  const { data: alreadySent } = await supabase
    .from(TABLES.EVENTO_EMAIL_LOG)
    .select("id")
    .eq("inscricao_id", params.inscricaoId)
    .eq("tipo_email", "ticket_confirmacao")
    .maybeSingle();

  if (!alreadySent) {
    const { data: eventoRowData } = await supabase
      .from(TABLES.EVENTOS)
      .select("data_sabado_1, data_sabado_2, data_sabado_3")
      .eq("id", inscricao.evento_id)
      .single();

    await sendTicketEmail(inscricao, asSupabaseRow<"eventos">(eventoRowData));
    await supabase.from(TABLES.EVENTO_EMAIL_LOG).insert(
      asSupabaseInsert<"evento_email_log">({
        inscricao_id: params.inscricaoId,
        tipo_email: "ticket_confirmacao",
      }),
    );
  }

  return inscricao;
}
