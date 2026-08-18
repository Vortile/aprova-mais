import { describe, expect, it } from "vitest";
import type { Database } from "@repo/db";
import { computeDripSchedule } from "./drip-schedule";

type Inscricao = Database["public"]["Tables"]["evento_inscricoes"]["Row"];
type Evento = Database["public"]["Tables"]["eventos"]["Row"];

function fakeInscricao(overrides: Partial<Inscricao> = {}): Inscricao {
  return {
    id: "insc-1",
    evento_id: "evt-1",
    numero_inscricao: 1,
    session_id: null,
    nome_aluno: "Aluno Teste",
    email_aluno: "aluno@example.com",
    whatsapp_aluno: "92999999999",
    cpf_aluno: "11144477735",
    data_nascimento: "2005-01-01",
    idade_aluno: 20,
    serie_atual: "3_ano",
    nome_responsavel: null,
    whatsapp_responsavel: null,
    restricoes_medicas: null,
    status_pagamento: "aprovado",
    forma_pagamento: "pix",
    gateway: "mercadopago",
    gateway_payment_id: "123",
    numero_confirmacao: 1,
    turma_alocada: 1,
    horario_turma: "08:00 às 12:00",
    sala_alocada: "Sala HY",
    codigo_ingresso: "ticket-1",
    valor_pago_centavos: 50000,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    created_at: "2026-08-01T00:00:00Z",
    pago_em: null,
    ...overrides,
  };
}

function fakeEvento(overrides: Partial<Evento> = {}): Evento {
  return {
    id: "evt-1",
    slug: "intensivao-enem-medicina-2026",
    titulo: "Intensivão ENEM 2026 — Foco Medicina",
    descricao: null,
    preco_centavos: 50000,
    limite_total_vagas: 26,
    capacidade_por_turma: 13,
    local_nome: "Open Laranjeiras Gallery",
    local_endereco: "Av. Prof. Nilton Lins, 1984",
    local_contato: "(92) 98158-1955",
    horario_geral: "08:00 às 12:00",
    sala_turma_1: "Sala HY",
    sala_turma_2: null,
    data_sabado_1: null,
    data_sabado_2: null,
    data_sabado_3: null,
    data_sabado_4: null,
    ativo: true,
    created_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeDripSchedule", () => {
  it("returns nothing when payment date and Saturday dates are all unset", () => {
    const items = computeDripSchedule(
      fakeInscricao({ pago_em: null }),
      fakeEvento(),
    );
    expect(items).toEqual([]);
  });

  it("schedules the payment-based drip e-mails relative to pago_em", () => {
    const items = computeDripSchedule(
      fakeInscricao({ pago_em: "2026-08-10T12:00:00Z" }),
      fakeEvento(),
    );

    const byTipo = Object.fromEntries(
      items.map((item) => [
        item.tipo,
        item.targetDate.toISOString().slice(0, 10),
      ]),
    );

    expect(byTipo.guia_preparacao).toBe("2026-08-12");
    expect(byTipo.mensagem_professor).toBe("2026-08-14");
    expect(byTipo.mapa_tri).toBe("2026-08-16");
  });

  it("schedules checklist 2 days before sábado 1 and devolutiva 1 day after", () => {
    const items = computeDripSchedule(
      fakeInscricao({ pago_em: null }),
      fakeEvento({ data_sabado_1: "2026-09-12" }),
    );

    const byTipo = Object.fromEntries(
      items.map((item) => [
        item.tipo,
        item.targetDate.toISOString().slice(0, 10),
      ]),
    );

    expect(byTipo.checklist_evento).toBe("2026-09-10");
    expect(byTipo.devolutiva_dia1).toBe("2026-09-13");
  });

  it("only schedules pos_evento once sábado 4 is set (final day of the 4-Saturday event)", () => {
    const withoutSabado3 = computeDripSchedule(
      fakeInscricao({ pago_em: null }),
      fakeEvento({ data_sabado_1: "2026-09-12", data_sabado_2: "2026-09-19" }),
    );
    expect(withoutSabado3.some((item) => item.tipo === "pos_evento")).toBe(
      false,
    );

    const withSabado4 = computeDripSchedule(
      fakeInscricao({ pago_em: null }),
      fakeEvento({
        data_sabado_1: "2026-09-12",
        data_sabado_2: "2026-09-19",
        data_sabado_3: "2026-09-26",
        data_sabado_4: "2026-10-03",
      }),
    );
    const devolutiva3 = withSabado4.find((item) => item.tipo === "devolutiva_dia3");
    const posEvento = withSabado4.find((item) => item.tipo === "pos_evento");
    expect(devolutiva3?.targetDate.toISOString().slice(0, 10)).toBe("2026-09-27");
    expect(posEvento?.targetDate.toISOString().slice(0, 10)).toBe("2026-10-04");
  });
});
