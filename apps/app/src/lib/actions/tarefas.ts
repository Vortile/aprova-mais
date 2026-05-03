"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TABLES, type Database } from "@repo/db";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseInsert, asSupabaseUpdate } from "@/lib/supabase/typed";
import { ROUTES } from "@/lib/routes";
import { ROLES } from "@/lib/supabase/env";
import { ACTION_ERRORS } from "@/lib/errors";

const uuidSchema = z.string().uuid();

const saveTarefaSchema = z.object({
  title: z.string().trim().min(1, "Informe o título"),
  description: z.string().trim(),
  dueDate: z.string().trim(),
  materialId: z.string().trim(),
  alunoIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um aluno"),
});

const entregaSchema = z.object({
  entregaId: z.string().uuid(),
  studentNotes: z.string().trim(),
  submissionUrl: z.string().trim().url("URL inválida").or(z.literal("")),
});

const entregaIdSchema = z.object({
  entregaId: z.string().uuid(),
});

const feedbackSchema = z.object({
  entregaId: z.string().uuid(),
  teacherFeedback: z.string().trim(),
});

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

type AppSession = Awaited<ReturnType<typeof getCurrentAppSession>>;
type TarefaAlunoRow = Database["public"]["Tables"]["tarefa_alunos"]["Row"];

async function requireSession() {
  const session = await getCurrentAppSession();

  if (!session) {
    return { error: ACTION_ERRORS.SESSION_EXPIRED } as const;
  }

  return { session } as const;
}

async function requireAdminSession() {
  const result = await requireSession();

  if ("error" in result) {
    return result;
  }

  if (result.session.profile.role === ROLES.ALUNO) {
    return {
      error: "Apenas professores e administradores podem gerenciar tarefas.",
    } as const;
  }

  return result;
}

async function requireAlunoRecord(session: NonNullable<AppSession>) {
  const { data } = await createAdminClient()
    .from(TABLES.ALUNOS)
    .select("id")
    .eq("profile_id", session.profile.id)
    .limit(1);

  const alunoId = (data?.[0] as { id: string } | undefined)?.id;

  if (!alunoId) {
    return { error: "Seu cadastro de aluno ainda não foi vinculado." } as const;
  }

  return { alunoId } as const;
}

async function findEntregaForAluno(entregaId: string, profileId: string) {
  const { data } = await createAdminClient()
    .from(TABLES.TAREFA_ALUNOS)
    .select("id, aluno_id, status, alunos(profile_id)")
    .eq("id", entregaId)
    .single();

  const entrega = data as
    | (Pick<TarefaAlunoRow, "id" | "aluno_id" | "status"> & {
        alunos: { profile_id: string | null } | null;
      })
    | null;

  if (!entrega || entrega.alunos?.profile_id !== profileId) {
    return null;
  }

  return entrega;
}

function revalidateTarefas() {
  revalidatePath(ROUTES.ADMIN.TAREFAS);
  revalidatePath(ROUTES.ALUNO.TAREFAS);
}

export async function saveTarefa(input: unknown): Promise<ActionResult> {
  const values = saveTarefaSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para criar a tarefa." };
  }

  const access = await requireAdminSession();

  if ("error" in access) {
    return {
      ok: false,
      error: access.error ?? "Não foi possível validar sua sessão.",
    };
  }

  const supabase = createAdminClient();
  const { data: tarefaData, error: tarefaError } = await supabase
    .from(TABLES.TAREFAS)
    .insert(
      asSupabaseInsert<"tarefas">({
        title: values.data.title,
        description: values.data.description || null,
        due_date: values.data.dueDate || null,
        material_id: values.data.materialId || null,
        created_by: access.session.profile.id,
      }),
    )
    .select("id")
    .single();
  const tarefa = tarefaData as { id: string } | null;

  if (tarefaError || !tarefa) {
    return { ok: false, error: "Não foi possível criar a tarefa." };
  }

  const { error: entregaError } = await supabase
    .from(TABLES.TAREFA_ALUNOS)
    .insert(
      values.data.alunoIds.map((alunoId) =>
        asSupabaseInsert<"tarefa_alunos">({
          tarefa_id: tarefa.id,
          aluno_id: alunoId,
        }),
      ),
    );

  if (entregaError) {
    await supabase.from(TABLES.TAREFAS).delete().eq("id", tarefa.id);
    return {
      ok: false,
      error: "A tarefa foi criada, mas não pôde ser atribuída aos alunos.",
    };
  }

  revalidateTarefas();

  return { ok: true, message: "Tarefa criada." };
}

const updateTarefaSchema = z.object({
  tarefaId: z.string().uuid(),
  title: z.string().trim().min(1, "Informe o título"),
  description: z.string().trim(),
  dueDate: z.string().trim(),
  materialId: z.string().trim(),
  alunoIds: z.array(z.string().uuid()).optional(),
});

export async function updateTarefa(input: unknown): Promise<ActionResult> {
  const values = updateTarefaSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para atualizar a tarefa." };
  }

  const access = await requireAdminSession();

  if ("error" in access) {
    return {
      ok: false,
      error: access.error ?? "Não foi possível validar sua sessão.",
    };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from(TABLES.TAREFAS)
    .update(
      asSupabaseUpdate<"tarefas">({
        title: values.data.title,
        description: values.data.description || null,
        due_date: values.data.dueDate || null,
        material_id: values.data.materialId || null,
      }),
    )
    .eq("id", values.data.tarefaId);

  if (error) {
    return { ok: false, error: "Não foi possível atualizar a tarefa." };
  }

  // Sync aluno assignments when provided
  if (values.data.alunoIds !== undefined) {
    const newIds = new Set(values.data.alunoIds);

    // Fetch current assignments
    const { data: current } = await supabase
      .from(TABLES.TAREFA_ALUNOS)
      .select("id, aluno_id, status")
      .eq("tarefa_id", values.data.tarefaId);

    const existing = (current ?? []) as {
      id: string;
      aluno_id: string;
      status: string;
    }[];

    // Remove pending-only rows for alunos no longer in the list
    const toRemove = existing
      .filter((e) => !newIds.has(e.aluno_id) && e.status === "pendente")
      .map((e) => e.id);

    if (toRemove.length > 0) {
      await supabase.from(TABLES.TAREFA_ALUNOS).delete().in("id", toRemove);
    }

    // Insert new assignments for alunos not yet in the table
    const existingAlunoIds = new Set(existing.map((e) => e.aluno_id));
    const toAdd = [...newIds].filter((id) => !existingAlunoIds.has(id));

    if (toAdd.length > 0) {
      const now = new Date().toISOString();
      await supabase.from(TABLES.TAREFA_ALUNOS).insert(
        toAdd.map((aluno_id) =>
          asSupabaseInsert<"tarefa_alunos">({
            tarefa_id: values.data.tarefaId,
            aluno_id,
            status: "pendente",
            created_at: now,
            updated_at: now,
          }),
        ),
      );
    }
  }

  revalidateTarefas();

  return { ok: true, message: "Tarefa atualizada." };
}

export async function markTarefaInProgress(
  input: unknown,
): Promise<ActionResult> {
  const values = entregaIdSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Entrega inválida." };
  }

  const result = await requireSession();

  if ("error" in result) {
    return {
      ok: false,
      error: result.error ?? "Não foi possível validar sua sessão.",
    };
  }

  if (result.session.profile.role !== "aluno") {
    return { ok: false, error: "Apenas alunos podem atualizar esta tarefa." };
  }

  const entrega = await findEntregaForAluno(
    values.data.entregaId,
    result.session.profile.id,
  );

  if (!entrega) {
    return { ok: false, error: "Tarefa não encontrada para este aluno." };
  }

  if (entrega.status !== "pendente") {
    return { ok: true, message: "A tarefa já estava iniciada." };
  }

  const { error } = await createAdminClient()
    .from(TABLES.TAREFA_ALUNOS)
    .update(
      asSupabaseUpdate<"tarefa_alunos">({
        status: "em_andamento",
        updated_at: new Date().toISOString(),
      }),
    )
    .eq("id", entrega.id);

  if (error) {
    return {
      ok: false,
      error: "Não foi possível atualizar o status da tarefa.",
    };
  }

  revalidateTarefas();

  return { ok: true, message: "Tarefa marcada como em andamento." };
}

export async function submitTarefa(input: unknown): Promise<ActionResult> {
  const values = entregaSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para enviar a tarefa." };
  }

  const result = await requireSession();

  if ("error" in result) {
    return {
      ok: false,
      error: result.error ?? "Não foi possível validar sua sessão.",
    };
  }

  if (result.session.profile.role !== "aluno") {
    return { ok: false, error: "Apenas alunos podem enviar tarefas." };
  }

  const aluno = await requireAlunoRecord(result.session);

  if ("error" in aluno) {
    return {
      ok: false,
      error: aluno.error ?? "Seu cadastro de aluno ainda não foi vinculado.",
    };
  }

  const entrega = await findEntregaForAluno(
    values.data.entregaId,
    result.session.profile.id,
  );

  if (!entrega || entrega.aluno_id !== aluno.alunoId) {
    return { ok: false, error: "Tarefa não encontrada para este aluno." };
  }

  const now = new Date().toISOString();
  const { error } = await createAdminClient()
    .from(TABLES.TAREFA_ALUNOS)
    .update(
      asSupabaseUpdate<"tarefa_alunos">({
        status: "entregue",
        student_notes: values.data.studentNotes || null,
        submission_url: values.data.submissionUrl || null,
        submitted_at: now,
        updated_at: now,
      }),
    )
    .eq("id", entrega.id);

  if (error) {
    return { ok: false, error: "Não foi possível enviar a tarefa." };
  }

  revalidateTarefas();

  return { ok: true, message: "Tarefa enviada." };
}

export async function reviewTarefa(input: unknown): Promise<ActionResult> {
  const values = feedbackSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para revisar a entrega." };
  }

  const access = await requireAdminSession();

  if ("error" in access) {
    return {
      ok: false,
      error: access.error ?? "Não foi possível validar sua sessão.",
    };
  }

  const now = new Date().toISOString();
  const { error } = await createAdminClient()
    .from(TABLES.TAREFA_ALUNOS)
    .update(
      asSupabaseUpdate<"tarefa_alunos">({
        status: "revisado",
        teacher_feedback: values.data.teacherFeedback || null,
        reviewed_at: now,
        updated_at: now,
      }),
    )
    .eq("id", values.data.entregaId);

  if (error) {
    return { ok: false, error: "Não foi possível salvar o feedback." };
  }

  revalidateTarefas();

  return { ok: true, message: "Feedback salvo." };
}

export async function deleteTarefa(input: unknown): Promise<ActionResult> {
  const tarefaId = uuidSchema.safeParse(input);

  if (!tarefaId.success) {
    return { ok: false, error: "Tarefa inválida." };
  }

  const access = await requireAdminSession();

  if ("error" in access) {
    return {
      ok: false,
      error: access.error ?? "Não foi possível validar sua sessão.",
    };
  }

  const { error } = await createAdminClient()
    .from(TABLES.TAREFAS)
    .delete()
    .eq("id", tarefaId.data);

  if (error) {
    return { ok: false, error: "Não foi possível remover a tarefa." };
  }

  revalidateTarefas();

  return { ok: true, message: "Tarefa removida." };
}
