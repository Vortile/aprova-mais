"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TABLES } from "@repo/db";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACTION_ERRORS } from "@/lib/errors";
import { ROUTES } from "@/lib/routes";
import { DISCIPLINAS, STATUS_CONTEUDO_VALUES } from "@/lib/relatorios-constants";

type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const relatorioPedagogicoSchema = z.object({
  alunoId: z.string().uuid("Selecione um aluno válido"),
  disciplinas: z
    .array(z.enum(DISCIPLINAS))
    .min(1, "Selecione ao menos uma disciplina"),
  cargaHoraria: z.string().trim().min(1, "Informe a carga horária"),
  statusConteudo: z.enum(STATUS_CONTEUDO_VALUES, {
    errorMap: () => ({ message: "Selecione um status" }),
  }),
  engajamento: z.coerce
    .number()
    .int()
    .min(0, "Mínimo 0")
    .max(100, "Máximo 100"),
});

const notaProvaSchema = z.object({
  alunoId: z.string().uuid("Selecione um aluno válido"),
  disciplina: z.enum(DISCIPLINAS, {
    errorMap: () => ({ message: "Selecione uma disciplina" }),
  }),
  dataProva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  descricao: z.string().trim().min(1, "Descreva a prova"),
  nota: z.coerce.number().min(0, "Nota não pode ser negativa"),
  notaMaxima: z.coerce.number().min(0.1, "Nota máxima deve ser maior que 0"),
});

const registroListaSchema = z.object({
  alunoId: z.string().uuid("Selecione um aluno válido"),
  disciplina: z.enum(DISCIPLINAS, {
    errorMap: () => ({ message: "Selecione uma disciplina" }),
  }),
  dataAula: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  conteudoMinistrado: z.string().trim().min(1, "Informe o conteúdo ministrado"),
  quantidadeAcertos: z
    .number()
    .int()
    .min(0, "Não pode ser negativo"),
  totalQuestoes: z
    .number()
    .int()
    .min(1, "Total de questões deve ser ao menos 1"),
});

async function requireProfessorSession() {
  const session = await getCurrentAppSession();

  if (!session) {
    return { error: ACTION_ERRORS.SESSION_EXPIRED } as const;
  }

  if (session.profile.role === "aluno") {
    return { error: "Apenas professores podem preencher relatórios." } as const;
  }

  return { session } as const;
}

export async function saveRelatorioPedagogico(
  input: unknown,
): Promise<ActionResult> {
  const access = await requireProfessorSession();
  if ("error" in access) return { ok: false, error: access.error as string };

  const parsed = relatorioPedagogicoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }

  const { alunoId, disciplinas, cargaHoraria, statusConteudo } = parsed.data;
  const supabase = createAdminClient();
  const professorId = access.session.profile.id;

  // Ensure the professor is allowed to report on this aluno
  const { data: alunoCheck } = await supabase
    .from(TABLES.ALUNOS)
    .select("id")
    .eq("id", alunoId)
    .eq("professor_id", professorId)
    .limit(1);

  if (!alunoCheck?.length && access.session.profile.role !== "admin") {
    return { ok: false, error: "Você não tem permissão para reportar sobre este aluno." };
  }

  const { error } = await supabase.from(TABLES.RELATORIOS_PEDAGOGICOS).insert({
    professor_id: professorId,
    aluno_id: alunoId,
    disciplinas,
    carga_horaria: cargaHoraria,
    status_conteudo: statusConteudo,
    engajamento: parsed.data.engajamento,
  } as never);

  if (error) {
    console.error("[saveRelatorioPedagogico]", error);
    return { ok: false, error: "Erro ao salvar relatório. Tente novamente." };
  }

  revalidatePath(ROUTES.ADMIN.RELATORIOS);
  return { ok: true, message: "Relatório pedagógico salvo com sucesso!" };
}

export async function saveRegistroLista(input: unknown): Promise<ActionResult> {
  const access = await requireProfessorSession();
  if ("error" in access) return { ok: false, error: access.error as string };

  const parsed = registroListaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }

  const {
    alunoId,
    disciplina,
    dataAula,
    conteudoMinistrado,
    quantidadeAcertos,
    totalQuestoes,
  } = parsed.data;

  if (quantidadeAcertos > totalQuestoes) {
    return { ok: false, error: "Acertos não pode ser maior que o total de questões." };
  }

  const supabase = createAdminClient();
  const professorId = access.session.profile.id;

  const { data: alunoCheck } = await supabase
    .from(TABLES.ALUNOS)
    .select("id")
    .eq("id", alunoId)
    .eq("professor_id", professorId)
    .limit(1);

  if (!alunoCheck?.length && access.session.profile.role !== "admin") {
    return { ok: false, error: "Você não tem permissão para reportar sobre este aluno." };
  }

  const { error } = await supabase.from(TABLES.REGISTROS_LISTA).insert({
    professor_id: professorId,
    aluno_id: alunoId,
    disciplina,
    data_aula: dataAula,
    conteudo_ministrado: conteudoMinistrado,
    quantidade_acertos: quantidadeAcertos,
    total_questoes: totalQuestoes,
  } as never);

  if (error) {
    console.error("[saveRegistroLista]", error);
    return { ok: false, error: "Erro ao salvar registro. Tente novamente." };
  }

  revalidatePath(ROUTES.ADMIN.RELATORIOS);
  return { ok: true, message: "Registro de lista salvo com sucesso!" };
}

export async function saveNotaProva(input: unknown): Promise<ActionResult> {
  const access = await requireProfessorSession();
  if ("error" in access) return { ok: false, error: access.error as string };

  const parsed = notaProvaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }

  const { alunoId, disciplina, dataProva, descricao, nota, notaMaxima } = parsed.data;

  if (nota > notaMaxima) {
    return { ok: false, error: "Nota não pode ser maior que a nota máxima." };
  }

  const supabase = createAdminClient();
  const professorId = access.session.profile.id;

  const { error } = await supabase.from(TABLES.NOTAS_PROVAS).insert({
    professor_id: professorId,
    aluno_id: alunoId,
    disciplina,
    data_prova: dataProva,
    descricao,
    nota,
    nota_maxima: notaMaxima,
  } as never);

  if (error) {
    console.error("[saveNotaProva]", error);
    return { ok: false, error: "Erro ao salvar nota. Tente novamente." };
  }

  revalidatePath(ROUTES.ADMIN.RELATORIOS);
  return { ok: true, message: "Nota de prova salva com sucesso!" };
}
