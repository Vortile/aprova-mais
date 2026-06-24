"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseInsert, asSupabaseUpdate } from "@/lib/supabase/typed";
import { MATERIALS_BUCKET, getMaterialStoragePath } from "@/lib/materials";
import { TABLES, type Database } from "@repo/db";
import { ROUTES } from "@/lib/routes";
import { ROLES } from "@/lib/supabase/env";
import { ACTION_ERRORS } from "@/lib/errors";

type MaterialOwnerRow = Pick<
  Database["public"]["Tables"]["materiais"]["Row"],
  "id" | "file_url" | "uploaded_by" | "created_by_admin_id"
>;

const materialMetaSchema = z.object({
  title: z.string().trim().min(1, "Informe o título"),
  description: z.string().trim(),
  subject: z.string().trim(),
  gradeLevel: z.string().trim(),
  uploadedBy: z.string().uuid().optional().nullable(),
});

const createMaterialSchema = materialMetaSchema.extend({
  filePath: z.string().trim().min(1, "Envie um arquivo para o material"),
});

const updateMaterialSchema = materialMetaSchema.extend({
  materialId: z.string().uuid(),
});

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function assertStaffSession() {
  const session = await getCurrentAppSession();

  if (
    !session ||
    (session.profile.role !== ROLES.ADMIN &&
      session.profile.role !== ROLES.PROFESSOR)
  ) {
    return null;
  }

  return session;
}

async function fetchMaterialOwner(
  supabase: ReturnType<typeof createAdminClient>,
  materialId: string,
): Promise<MaterialOwnerRow | null> {
  const { data } = await supabase
    .from(TABLES.MATERIAIS)
    .select("id, file_url, uploaded_by, created_by_admin_id")
    .eq("id", materialId)
    .maybeSingle();

  return (data as MaterialOwnerRow | null) ?? null;
}

function canMutate(
  session: Awaited<ReturnType<typeof assertStaffSession>>,
  uploadedBy: string | null,
) {
  if (!session) return false;
  if (session.profile.role === ROLES.ADMIN) return true;
  return session.profile.id === uploadedBy;
}

export async function createMaterial(input: unknown): Promise<ActionResult> {
  const values = createMaterialSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para criar o material." };
  }

  const session = await assertStaffSession();

  if (!session) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION };
  }

  const isAdmin = session.profile.role === ROLES.ADMIN;
  let uploaded_by: string;
  let created_by_admin_id: string | null = null;

  if (isAdmin) {
    if (
      !values.data.uploadedBy ||
      values.data.uploadedBy === session.profile.id
    ) {
      return {
        ok: false,
        error:
          "Administradores não podem criar materiais para si mesmos. Selecione um professor proprietário.",
      };
    }

    const { data: targetProfile } = await createAdminClient()
      .from(TABLES.PROFILES)
      .select("role")
      .eq("id", values.data.uploadedBy)
      .maybeSingle();

    if (
      !targetProfile ||
      (targetProfile as { role: string }).role !== ROLES.PROFESSOR
    ) {
      return {
        ok: false,
        error: "O proprietário selecionado deve ser um professor cadastrado.",
      };
    }

    uploaded_by = values.data.uploadedBy;
    created_by_admin_id = session.profile.id;
  } else {
    uploaded_by = session.profile.id;
  }

  const { error } = await createAdminClient()
    .from(TABLES.MATERIAIS)
    .insert(
      asSupabaseInsert<"materiais">({
        title: values.data.title,
        description: values.data.description || null,
        file_url: values.data.filePath,
        subject: values.data.subject || null,
        grade_level: values.data.gradeLevel || null,
        uploaded_by,
        created_by_admin_id,
      }),
    );

  if (error) {
    return { ok: false, error: "Não foi possível criar o material." };
  }

  revalidatePath(ROUTES.ADMIN.MATERIAIS);
  revalidatePath(ROUTES.ALUNO.MATERIAIS);

  return { ok: true, message: "Material criado." };
}

export async function updateMaterial(input: unknown): Promise<ActionResult> {
  const values = updateMaterialSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para atualizar o material." };
  }

  const session = await assertStaffSession();

  if (!session) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION };
  }

  const supabase = createAdminClient();
  const material = await fetchMaterialOwner(supabase, values.data.materialId);

  if (!material) {
    return { ok: false, error: "Material não encontrado." };
  }

  if (!canMutate(session, material.uploaded_by)) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION };
  }

  const isAdmin = session.profile.role === ROLES.ADMIN;
  let uploaded_by: string;
  let created_by_admin_id: string | null = material.created_by_admin_id;

  if (isAdmin) {
    if (
      !values.data.uploadedBy ||
      values.data.uploadedBy === session.profile.id
    ) {
      return {
        ok: false,
        error:
          "Administradores não podem atribuir materiais para si mesmos. Selecione um professor proprietário.",
      };
    }

    const { data: targetProfile } = await createAdminClient()
      .from(TABLES.PROFILES)
      .select("role")
      .eq("id", values.data.uploadedBy)
      .maybeSingle();

    if (
      !targetProfile ||
      (targetProfile as { role: string }).role !== ROLES.PROFESSOR
    ) {
      return {
        ok: false,
        error: "O proprietário selecionado deve ser um professor cadastrado.",
      };
    }

    uploaded_by = values.data.uploadedBy;
    created_by_admin_id = session.profile.id;
  } else {
    uploaded_by = session.profile.id;
  }

  const { error } = await supabase
    .from(TABLES.MATERIAIS)
    .update(
      asSupabaseUpdate<"materiais">({
        title: values.data.title,
        description: values.data.description || null,
        subject: values.data.subject || null,
        grade_level: values.data.gradeLevel || null,
        uploaded_by,
        created_by_admin_id,
      }),
    )
    .eq("id", material.id);

  if (error) {
    return { ok: false, error: "Não foi possível atualizar o material." };
  }

  revalidatePath(ROUTES.ADMIN.MATERIAIS);
  revalidatePath(ROUTES.ALUNO.MATERIAIS);

  return { ok: true, message: "Material atualizado." };
}

const deleteMaterialSchema = z.string().uuid();

export async function deleteMaterial(
  materialId: unknown,
): Promise<ActionResult> {
  if (!deleteMaterialSchema.safeParse(materialId).success) {
    return { ok: false, error: "Material inválido para exclusão." };
  }

  const session = await assertStaffSession();

  if (!session) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION };
  }

  const supabase = createAdminClient();
  const material = await fetchMaterialOwner(supabase, materialId as string);

  if (!material) {
    return { ok: false, error: "Material não encontrado." };
  }

  if (!canMutate(session, material.uploaded_by)) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION };
  }

  // Delete from storage first
  const storagePath = getMaterialStoragePath(material.file_url);

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(MATERIALS_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      return {
        ok: false,
        error: "Não foi possível excluir o arquivo do armazenamento.",
      };
    }
  }

  const { error: dbError } = await supabase
    .from(TABLES.MATERIAIS)
    .delete()
    .eq("id", material.id);

  if (dbError) {
    return { ok: false, error: "Não foi possível excluir o material." };
  }

  revalidatePath(ROUTES.ADMIN.MATERIAIS);
  revalidatePath(ROUTES.ALUNO.MATERIAIS);

  return { ok: true, message: "Material excluído." };
}

const assignSchema = z.object({
  materialId: z.string().uuid(),
  alunoIds: z.array(z.string().uuid()),
});

export async function updateMaterialAssignments(
  input: unknown,
): Promise<ActionResult> {
  const values = assignSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para atribuição." };
  }

  const session = await assertStaffSession();

  if (!session) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION };
  }

  const supabase = createAdminClient();
  const { materialId, alunoIds } = values.data;
  const isAdmin = session.profile.role === ROLES.ADMIN;

  if (isAdmin) {
    // Admin: replace all assignments for this material
    await supabase
      .from(TABLES.ALUNO_MATERIAIS)
      .delete()
      .eq("material_id", materialId);
  } else {
    // Professor: only remove assignments for their own students
    const { data: myAlunos } = await supabase
      .from(TABLES.ALUNOS)
      .select("id")
      .eq("professor_id", session.profile.id);

    const myAlunoIds = (myAlunos ?? []).map((a) => (a as { id: string }).id);

    if (myAlunoIds.length > 0) {
      await supabase
        .from(TABLES.ALUNO_MATERIAIS)
        .delete()
        .eq("material_id", materialId)
        .in("aluno_id", myAlunoIds);
    }

    // Ensure professor can only assign to their own students
    const validIds = alunoIds.filter((id) => myAlunoIds.includes(id));
    values.data.alunoIds.splice(0, values.data.alunoIds.length, ...validIds);
  }

  if (alunoIds.length > 0) {
    const inserts = alunoIds.map((alunoId) =>
      asSupabaseInsert<"aluno_materiais">({
        aluno_id: alunoId,
        material_id: materialId,
        assigned_by: session.profile.id,
      }),
    );

    const { error } = await supabase
      .from(TABLES.ALUNO_MATERIAIS)
      .insert(inserts);

    if (error) {
      return { ok: false, error: "Não foi possível salvar as atribuições." };
    }
  }

  revalidatePath(ROUTES.ADMIN.MATERIAIS);
  revalidatePath(ROUTES.ALUNO.MATERIAIS);

  return { ok: true, message: "Atribuições salvas." };
}
