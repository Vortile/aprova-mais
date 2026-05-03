"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseInsert, asSupabaseUpdate } from "@/lib/supabase/typed";
import { TABLES } from "@repo/db";
import { ROUTES } from "@/lib/routes";
import { ROLES } from "@/lib/supabase/env";
import { ACTION_ERRORS } from "@/lib/errors";

async function assertAdmin() {
  const session = await getCurrentAppSession();
  if (!session) return null;
  if (session.profile.role !== ROLES.ADMIN) return null;
  return session;
}

const amountSchema = z.preprocess((v) => {
  if (typeof v === "string") return Number(v.replace(",", "."));
  return v;
}, z.number().finite().positive("Informe um valor maior que zero"));

const saveRegistroSchema = z.object({
  alunoId: z.string().uuid("Selecione um aluno"),
  amount: amountSchema,
  dueDate: z.string().trim().min(1, "Informe o vencimento"),
  paidAt: z.string().trim(),
  notes: z.string().trim(),
});

export async function saveRegistroFinanceiro(input: unknown) {
  const values = saveRegistroSchema.safeParse(input);

  if (!values.success) {
    return {
      ok: false,
      error: "Dados inválidos para registrar o lançamento.",
    } as const;
  }

  const session = await assertAdmin();
  if (!session) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION } as const;
  }

  const { error } = await createAdminClient()
    .from(TABLES.FINANCEIRO)
    .insert(
      asSupabaseInsert<"financeiro">({
        aluno_id: values.data.alunoId,
        amount: values.data.amount,
        due_date: values.data.dueDate || null,
        paid_at: values.data.paidAt
          ? new Date(values.data.paidAt).toISOString()
          : null,
        notes: values.data.notes || null,
      }),
    );

  if (error) {
    return {
      ok: false,
      error: "Não foi possível registrar o lançamento.",
    } as const;
  }

  revalidatePath(ROUTES.ADMIN.FINANCEIRO);
  return { ok: true, message: "Lançamento registrado." } as const;
}

const updateRegistroSchema = z.object({
  registroId: z.string().uuid(),
  alunoId: z.string().uuid("Selecione um aluno"),
  amount: amountSchema,
  dueDate: z.string().trim().min(1, "Informe o vencimento"),
  paidAt: z.string().trim(),
  notes: z.string().trim(),
});

export async function updateRegistroFinanceiro(input: unknown) {
  const values = updateRegistroSchema.safeParse(input);

  if (!values.success) {
    return {
      ok: false,
      error: "Dados inválidos para atualizar o lançamento.",
    } as const;
  }

  const session = await assertAdmin();
  if (!session) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION } as const;
  }

  const { error } = await createAdminClient()
    .from(TABLES.FINANCEIRO)
    .update(
      asSupabaseUpdate<"financeiro">({
        aluno_id: values.data.alunoId,
        amount: values.data.amount,
        due_date: values.data.dueDate || null,
        paid_at: values.data.paidAt
          ? new Date(values.data.paidAt).toISOString()
          : null,
        notes: values.data.notes || null,
      }),
    )
    .eq("id", values.data.registroId);

  if (error) {
    return {
      ok: false,
      error: "Não foi possível atualizar o lançamento.",
    } as const;
  }

  revalidatePath(ROUTES.ADMIN.FINANCEIRO);
  return { ok: true, message: "Lançamento atualizado." } as const;
}

export async function deleteRegistroFinanceiro(registroId: string) {
  const idSchema = z.string().uuid();
  if (!idSchema.safeParse(registroId).success) {
    return { ok: false, error: "ID inválido." } as const;
  }

  const session = await assertAdmin();
  if (!session) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION } as const;
  }

  const { error } = await createAdminClient()
    .from(TABLES.FINANCEIRO)
    .delete()
    .eq("id", registroId);

  if (error) {
    return {
      ok: false,
      error: "Não foi possível excluir o lançamento.",
    } as const;
  }

  revalidatePath(ROUTES.ADMIN.FINANCEIRO);
  return { ok: true, message: "Lançamento excluído." } as const;
}

export async function marcarComoPago(registroId: string) {
  const idSchema = z.string().uuid();
  if (!idSchema.safeParse(registroId).success) {
    return { ok: false, error: "ID inválido." } as const;
  }

  const session = await assertAdmin();
  if (!session) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION } as const;
  }

  const { error } = await createAdminClient()
    .from(TABLES.FINANCEIRO)
    .update(
      asSupabaseUpdate<"financeiro">({ paid_at: new Date().toISOString() }),
    )
    .eq("id", registroId)
    .is("paid_at", null);

  if (error) {
    return {
      ok: false,
      error: "Não foi possível registrar o pagamento.",
    } as const;
  }

  revalidatePath(ROUTES.ADMIN.FINANCEIRO);
  return { ok: true, message: "Pagamento registrado." } as const;
}
