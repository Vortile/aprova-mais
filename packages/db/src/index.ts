export { createBrowserClient, createServerClient } from "@supabase/ssr";
export { createClient } from "@supabase/supabase-js";
export type { Database } from "./database.types";
export type { SupabaseClient } from "@supabase/supabase-js";

export const TABLES = {
  PROFILES: "profiles",
  ALUNOS: "alunos",
  PLANOS: "planos",
  MATERIAIS: "materiais",
  FINANCEIRO: "financeiro",
  TAREFAS: "tarefas",
  TAREFA_ALUNOS: "tarefa_alunos",
  ALUNO_MATERIAIS: "aluno_materiais",
  DEPOIMENTOS: "depoimentos",
} as const satisfies Record<string, string>;
