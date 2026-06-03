export { createBrowserClient, createServerClient } from "@supabase/ssr";
export { createClient } from "@supabase/supabase-js";
export type { Database } from "./database.types";
export type { SupabaseClient } from "@supabase/supabase-js";

export const TABLES = {
  PROFILES: "profiles",
  ALUNOS: "alunos",
  MATERIAIS: "materiais",
  FINANCEIRO: "financeiro",
  TAREFAS: "tarefas",
  TAREFA_ALUNOS: "tarefa_alunos",
  ALUNO_MATERIAIS: "aluno_materiais",
  DEPOIMENTOS: "depoimentos",
  RELATORIOS_PEDAGOGICOS: "relatorios_pedagogicos",
  REGISTROS_LISTA: "registros_lista",
  NOTAS_PROVAS: "notas_provas",
} as const satisfies Record<string, string>;
