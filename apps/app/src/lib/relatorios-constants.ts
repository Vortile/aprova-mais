export const DISCIPLINAS = [
  "Matematica",
  "Fisica",
  "Quimica",
  "Portugues",
  "Outras",
] as const;

export type Disciplina = (typeof DISCIPLINAS)[number];

export const STATUS_CONTEUDO_VALUES = [
  "Em dia com o cronograma do colégio",
  "Atrasado (precisa de atenção ou aulas extras)",
  "Conteúdo visto (Semana de Revisão/Exercícios)",
  "Outro",
] as const;

export type StatusConteudo = (typeof STATUS_CONTEUDO_VALUES)[number];
