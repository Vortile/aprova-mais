import { describe, expect, it } from "vitest";
import { generateTicketEmailHtml } from "./ticket-template";
import type { TableRow } from "@/lib/supabase/typed";

describe("generateTicketEmailHtml", () => {
  const mockInscricao: TableRow<"evento_inscricoes"> = {
    id: "insc-test-123",
    evento_id: "evt-test-123",
    numero_inscricao: 1,
    session_id: "sess-123",
    nome_aluno: "Ana Beatriz Silva",
    email_aluno: "ana.beatriz@exemplo.com",
    whatsapp_aluno: "92981112233",
    cpf_aluno: "12345678901",
    data_nascimento: "2006-05-15",
    idade_aluno: 18,
    serie_atual: "3_ano",
    nome_responsavel: null,
    whatsapp_responsavel: null,
    restricoes_medicas: null,
    status_pagamento: "aprovado",
    forma_pagamento: "pix",
    gateway: "mercadopago",
    gateway_payment_id: "pay-123",
    numero_confirmacao: 1,
    turma_alocada: 1,
    horario_turma: "08:00 às 10:00",
    sala_alocada: "Sala HY",
    codigo_ingresso: "APROVA-MED-12345678",
    valor_pago_centavos: 50000,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    created_at: "2026-08-18T10:00:00Z",
    pago_em: "2026-08-18T10:05:00Z",
  };

  it("renders recipient name, ticket price, and confirmation badge", () => {
    const html = generateTicketEmailHtml({ inscricao: mockInscricao });

    expect(html).toContain("Ana");
    expect(html).toContain("500,00");
    expect(html).toContain("Pagamento Confirmado");
    expect(html).toContain("Passaporte de Acesso Oficial");
  });

  it("renders allocated room, shift schedule, and QR code attachment reference", () => {
    const html = generateTicketEmailHtml({ inscricao: mockInscricao });

    expect(html).toContain("Sala HY");
    expect(html).toContain("08:00 às 10:00");
    expect(html).toContain("cid:ticket-qrcode");
    expect(html).toContain("APROVA-M");
  });

  it("renders Sala HY and mentor info for Turma 2", () => {
    const turma2Inscricao = {
      ...mockInscricao,
      turma_alocada: 2 as const,
      sala_alocada: null,
      horario_turma: null,
    };
    const html = generateTicketEmailHtml({ inscricao: turma2Inscricao });

    expect(html).toContain("Sala HY");
    expect(html).toContain("10:00 às 12:00");
    expect(html).toContain("Prof. Deuticilam Gomes Maia Júnior");
    expect(html).toContain("Prof. Juan Carlos Ribeiro Maia");
    expect(html).not.toContain("Grupo VIP do WhatsApp");
  });

  it("includes mentor references and WhatsApp CTA button", () => {
    const html = generateTicketEmailHtml({ inscricao: mockInscricao });

    expect(html).toContain("Prof. Deuticilam Gomes Maia Júnior");
    expect(html).toContain("Prof. Juan Carlos Ribeiro Maia");
    expect(html).toContain("Falar com a Equipe no WhatsApp");
  });

  it("includes essential responsive and email client compatibility elements", () => {
    const html = generateTicketEmailHtml({ inscricao: mockInscricao });

    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("http://www.w3.org/1999/xhtml");
    expect(html).toContain("viewport");
    expect(html).toContain("mobile-container");
    expect(html).toContain("mobile-card");
  });
});
