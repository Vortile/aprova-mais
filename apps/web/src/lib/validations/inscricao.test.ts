import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { inscricaoSchema } from "./inscricao";

const VALID_CPF = "111.444.777-35";

function baseValues(overrides: Partial<Record<string, string>> = {}) {
  return {
    nomeAluno: "Maria da Silva Souza",
    emailAluno: "maria@example.com",
    whatsappAluno: "(92) 99999-9999",
    cpfAluno: VALID_CPF,
    dataNascimento: "2005-01-01",
    serieAtual: "3_ano",
    nomeResponsavel: "",
    whatsappResponsavel: "",
    restricoesMedicas: "",
    ...overrides,
  };
}

describe("inscricaoSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a fully valid adult submission", () => {
    const result = inscricaoSchema.safeParse(baseValues());
    expect(result.success).toBe(true);
  });

  it("rejects an invalid CPF", () => {
    const result = inscricaoSchema.safeParse(
      baseValues({ cpfAluno: "111.444.777-36" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid e-mail", () => {
    const result = inscricaoSchema.safeParse(
      baseValues({ emailAluno: "not-an-email" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a WhatsApp number that is too short", () => {
    const result = inscricaoSchema.safeParse(
      baseValues({ whatsappAluno: "123" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a missing serieAtual", () => {
    const { serieAtual, ...rest } = baseValues();
    void serieAtual;
    const result = inscricaoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("requires nomeResponsavel and whatsappResponsavel for minors", () => {
    const result = inscricaoSchema.safeParse(
      baseValues({ dataNascimento: "2010-01-01" }), // 16 anos em 2026-08-16
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths).toContain("nomeResponsavel");
      expect(paths).toContain("whatsappResponsavel");
    }
  });

  it("accepts a minor when responsavel data is provided", () => {
    const result = inscricaoSchema.safeParse(
      baseValues({
        dataNascimento: "2010-01-01",
        nomeResponsavel: "João da Silva",
        whatsappResponsavel: "(92) 98888-8888",
      }),
    );
    expect(result.success).toBe(true);
  });
});
