// ─────────────────────────────────────────────────────────────────
// EVENTO IDENTITY — single source of truth for the Intensivão ENEM
// Medicina 2026.
// ─────────────────────────────────────────────────────────────────

export const evento = {
  slug: "intensivao-enem-medicina-2026",
  titulo: "Intensivão ENEM 2026 — Foco Medicina",
  precoReais: 500,
  limiteTotalVagas: 26,
  capacidadePorTurma: 13,
  limiarUrgenciaVagas: 10,
  localNome: "Open Laranjeiras Gallery",
  localEndereco: "Av. Prof. Nilton Lins, 1984 – Flores, Manaus - AM, 69058-300",
  localContato: "(92) 98158-1955",
  horarioTurma1: "08:00 às 10:00",
  horarioTurma2: "10:00 às 12:00",
  horarioGeral: "Turma 1: 08:00 às 10:00 | Turma 2: 10:00 às 12:00",
  salaTurma1: "Sala HY",
  salaTurma2: "Sala HY",
} as const;

export const serieOptions = [
  { value: "1_ano", label: "1º ano do Ensino Médio" },
  { value: "2_ano", label: "2º ano do Ensino Médio" },
  { value: "3_ano", label: "3º ano do Ensino Médio" },
  { value: "concluido", label: "Já concluiu o Ensino Médio" },
] as const;
