"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseInsert, asSupabaseUpdate } from "@/lib/supabase/typed";
import { TABLES } from "@repo/db";
import { ROUTES } from "@/lib/routes";
import { ROLES } from "@/lib/supabase/env";

const MAX_DEPOIMENTOS = 3;

const depoimentoSchema = z.object({
  quote: z.string().trim().min(1, "Informe o depoimento"),
  author: z.string().trim().min(1, "Informe o autor"),
  sort_order: z.number().int().default(0),
  active: z.boolean().default(true),
});

async function assertAdmin() {
  const session = await getCurrentAppSession();
  if (!session || session.profile.role !== ROLES.ADMIN) return null;
  return session;
}

function revalidate() {
  revalidatePath(ROUTES.ADMIN.DEPOIMENTOS);
}

export async function saveDepoimento(input: unknown) {
  const values = depoimentoSchema.safeParse(input);
  if (!values.success) {
    return { ok: false, error: "Dados inválidos." } as const;
  }

  const session = await assertAdmin();
  if (!session) {
    return {
      ok: false,
      error: "Apenas administradores podem gerenciar depoimentos.",
    } as const;
  }

  const supabase = createAdminClient();

  // Enforce max 3 testimonials
  const { count } = await supabase
    .from(TABLES.DEPOIMENTOS)
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) >= MAX_DEPOIMENTOS) {
    return {
      ok: false,
      error: `Máximo de ${MAX_DEPOIMENTOS} depoimentos permitidos. Edite ou remova um existente.`,
    } as const;
  }

  const { error } = await supabase.from(TABLES.DEPOIMENTOS).insert(
    asSupabaseInsert<"depoimentos">({
      quote: values.data.quote,
      author: values.data.author,
      sort_order: values.data.sort_order,
      active: values.data.active,
    }),
  );

  if (error) {
    return { ok: false, error: "Erro ao criar depoimento." } as const;
  }

  revalidate();
  return { ok: true, message: "Depoimento criado com sucesso." } as const;
}

export async function updateDepoimento(id: string, input: unknown) {
  const values = depoimentoSchema.safeParse(input);
  if (!values.success) {
    return { ok: false, error: "Dados inválidos." } as const;
  }

  const session = await assertAdmin();
  if (!session) {
    return {
      ok: false,
      error: "Apenas administradores podem gerenciar depoimentos.",
    } as const;
  }

  const { error } = await createAdminClient()
    .from(TABLES.DEPOIMENTOS)
    .update(
      asSupabaseUpdate<"depoimentos">({
        quote: values.data.quote,
        author: values.data.author,
        sort_order: values.data.sort_order,
        active: values.data.active,
      }),
    )
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Erro ao atualizar depoimento." } as const;
  }

  revalidate();
  return { ok: true, message: "Depoimento atualizado com sucesso." } as const;
}

export async function deleteDepoimento(id: string) {
  const session = await assertAdmin();
  if (!session) {
    return {
      ok: false,
      error: "Apenas administradores podem gerenciar depoimentos.",
    } as const;
  }

  const { error } = await createAdminClient()
    .from(TABLES.DEPOIMENTOS)
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Erro ao remover depoimento." } as const;
  }

  revalidate();
  return { ok: true, message: "Depoimento removido." } as const;
}
