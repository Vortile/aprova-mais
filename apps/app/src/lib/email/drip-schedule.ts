import type { Database } from "@repo/db";
import type { DripEmailType } from "@/lib/email/evento-drip";

type Inscricao = Database["public"]["Tables"]["evento_inscricoes"]["Row"];
type Evento = Database["public"]["Tables"]["eventos"]["Row"];

export type DripScheduleItem = { tipo: DripEmailType; targetDate: Date };

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Computes the drip e-mail schedule for a confirmed registration. Some
 * items depend on the payment date, others depend on the event's Saturday
 * dates (only included once an admin sets those dates).
 */
export function computeDripSchedule(
  inscricao: Inscricao,
  evento: Evento,
): DripScheduleItem[] {
  const items: DripScheduleItem[] = [];

  if (inscricao.pago_em) {
    const pagoEm = new Date(inscricao.pago_em);
    items.push({ tipo: "guia_preparacao", targetDate: addDays(pagoEm, 2) });
    items.push({ tipo: "mensagem_professor", targetDate: addDays(pagoEm, 4) });
    items.push({ tipo: "mapa_tri", targetDate: addDays(pagoEm, 6) });
  }

  if (evento.data_sabado_1) {
    const sabado1 = new Date(`${evento.data_sabado_1}T00:00:00`);
    items.push({ tipo: "checklist_evento", targetDate: addDays(sabado1, -2) });
    items.push({ tipo: "devolutiva_dia1", targetDate: addDays(sabado1, 1) });
  }

  if (evento.data_sabado_2) {
    const sabado2 = new Date(`${evento.data_sabado_2}T00:00:00`);
    items.push({ tipo: "devolutiva_dia2", targetDate: addDays(sabado2, 1) });
  }

  if (evento.data_sabado_3) {
    const sabado3 = new Date(`${evento.data_sabado_3}T00:00:00`);
    items.push({ tipo: "devolutiva_dia3", targetDate: addDays(sabado3, 1) });
  }

  if (evento.data_sabado_4) {
    const sabado4 = new Date(`${evento.data_sabado_4}T00:00:00`);
    items.push({ tipo: "pos_evento", targetDate: addDays(sabado4, 1) });
  }

  return items;
}
