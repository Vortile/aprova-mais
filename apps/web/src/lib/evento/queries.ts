import "server-only";

import { TABLES } from "@repo/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseRow } from "@/lib/supabase/typed";
import { evento as eventoConfig } from "@/lib/evento/config";

export type EventoStatus = {
  eventoId: string;
  slug: string;
  ativo: boolean;
  precoCentavos: number;
  limiteTotalVagas: number;
  capacidadePorTurma: number;
  vagasConfirmadas: number;
  vagasRestantes: number;
  turma1Ocupadas: number;
  turma2Ocupadas: number;
  esgotado: boolean;
  turma1Esgotada: boolean;
  dataSabado1: string | null;
  /** Divulgar o evento faz sentido enquanto ele estiver ativo, tiver vaga
   * e o primeiro sábado ainda não tiver começado. */
  promoAtivo: boolean;
};

/**
 * Reads the live event + confirmed seat count. Used by the landing page
 * and the registration form to show real-time scarcity and to block
 * checkout once the 26 seats are gone.
 */
export async function getEventoStatus(
  slug: string = eventoConfig.slug,
): Promise<EventoStatus | null> {
  const supabase = createAdminClient();

  const { data: eventoRowData, error: eventoError } = await supabase
    .from(TABLES.EVENTOS)
    .select(
      "id, slug, ativo, preco_centavos, limite_total_vagas, capacidade_por_turma, data_sabado_1",
    )
    .eq("slug", slug)
    .single();

  const eventoRow = asSupabaseRow<"eventos">(eventoRowData);

  if (eventoError || !eventoRow) {
    return null;
  }

  const { count } = await supabase
    .from(TABLES.EVENTO_INSCRICOES)
    .select("id", { count: "exact", head: true })
    .eq("evento_id", eventoRow.id)
    .eq("status_pagamento", "aprovado");

  const vagasConfirmadas = count ?? 0;
  const turma1Ocupadas = Math.min(
    vagasConfirmadas,
    eventoRow.capacidade_por_turma,
  );
  const turma2Ocupadas = Math.max(
    0,
    vagasConfirmadas - eventoRow.capacidade_por_turma,
  );

  const esgotado = vagasConfirmadas >= eventoRow.limite_total_vagas;
  const primeiroSabadoJaComecou = eventoRow.data_sabado_1
    ? new Date() >= new Date(`${eventoRow.data_sabado_1}T00:00:00`)
    : false;

  return {
    eventoId: eventoRow.id,
    slug: eventoRow.slug,
    ativo: eventoRow.ativo,
    precoCentavos: eventoRow.preco_centavos,
    limiteTotalVagas: eventoRow.limite_total_vagas,
    capacidadePorTurma: eventoRow.capacidade_por_turma,
    vagasConfirmadas,
    vagasRestantes: Math.max(
      0,
      eventoRow.limite_total_vagas - vagasConfirmadas,
    ),
    turma1Ocupadas,
    turma2Ocupadas,
    esgotado,
    turma1Esgotada: turma1Ocupadas >= eventoRow.capacidade_por_turma,
    dataSabado1: eventoRow.data_sabado_1,
    promoAtivo: eventoRow.ativo && !esgotado && !primeiroSabadoJaComecou,
  };
}
