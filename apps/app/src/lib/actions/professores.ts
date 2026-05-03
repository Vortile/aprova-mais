"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { TABLES, type Database } from "@repo/db";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail, ROLES } from "@/lib/supabase/env";
import { asSupabaseInsert, asSupabaseUpdate } from "@/lib/supabase/typed";
import { ROUTES } from "@/lib/routes";
import { ACTION_ERRORS } from "@/lib/errors";

const saveProfessorSchema = z.object({
  fullName: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().trim().email("Informe um email válido"),
  address: z.string().trim().optional(),
});

const updateProfessorSchema = z.object({
  profileId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres"),
  address: z.string().trim().optional(),
});

const profileIdSchema = z.string().uuid();

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function assertAdminAccess() {
  const session = await getCurrentAppSession();

  if (!session) {
    return { error: ACTION_ERRORS.SESSION_EXPIRED } as const;
  }

  if (session.profile.role !== ROLES.ADMIN) {
    return { error: ACTION_ERRORS.NO_PERMISSION } as const;
  }

  return { session } as const;
}

async function getAppOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) return origin;

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (host) return `${protocol}://${host}`;

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function revokePendingInvitations(normalizedEmail: string) {
  const client = await clerkClient();
  const invitations = await client.invitations.getInvitationList({
    query: normalizedEmail,
    limit: 100,
  });

  await Promise.all(
    invitations.data
      .filter(
        (inv) =>
          normalizeEmail(inv.emailAddress) === normalizedEmail &&
          inv.status === "pending",
      )
      .map((inv) => client.invitations.revokeInvitation(inv.id)),
  );
}

export async function saveProfessor(input: unknown): Promise<ActionResult> {
  const values = saveProfessorSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para salvar o professor." };
  }

  const access = await assertAdminAccess();

  if ("error" in access) {
    return { ok: false, error: access.error ?? ACTION_ERRORS.NO_PERMISSION };
  }

  const normalizedEmail = normalizeEmail(values.data.email);

  if (!normalizedEmail) {
    return { ok: false, error: "Email inválido." };
  }

  const supabase = createAdminClient();

  // Check if a profile with this email already exists
  const { data: existingRaw } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .ilike("email", normalizedEmail)
    .limit(1)
    .maybeSingle();

  const existing = existingRaw as ProfileRow | null;

  if (existing && existing.role !== ROLES.PROFESSOR) {
    return {
      ok: false,
      error: "Este email já está vinculado a uma conta que não é de professor.",
    };
  }

  if (existing) {
    return { ok: false, error: "Este professor já está cadastrado." };
  }

  // Create Clerk invitation
  const client = await clerkClient();

  await revokePendingInvitations(normalizedEmail);

  await client.invitations.createInvitation({
    emailAddress: normalizedEmail,
    ignoreExisting: true,
    notify: true,
    publicMetadata: {
      role: "professor",
      full_name: values.data.fullName,
    },
    redirectUrl: `${await getAppOrigin()}/sign-up`,
  });

  // Create profile row
  const { error: insertError } = await supabase.from(TABLES.PROFILES).insert(
    asSupabaseInsert<"profiles">({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      full_name: values.data.fullName,
      role: "professor",
      clerk_user_id: null,
      address: values.data.address || null,
    }),
  );

  if (insertError) {
    return { ok: false, error: "Não foi possível salvar o professor." };
  }

  revalidatePath(ROUTES.ADMIN.PROFESSORES);

  return { ok: true, message: "Convite enviado ao professor." };
}

export async function deleteProfessor(
  profileId: unknown,
): Promise<ActionResult> {
  if (!profileIdSchema.safeParse(profileId).success) {
    return { ok: false, error: "Professor inválido para exclusão." };
  }

  const access = await assertAdminAccess();

  if ("error" in access) {
    return { ok: false, error: access.error ?? ACTION_ERRORS.NO_PERMISSION };
  }

  const supabase = createAdminClient();

  const { data: profileRaw } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .eq("id", profileId as string)
    .eq("role", ROLES.PROFESSOR)
    .maybeSingle();

  const profile = profileRaw as ProfileRow | null;

  if (!profile) {
    return { ok: false, error: "Professor não encontrado." };
  }

  try {
    if (profile.clerk_user_id) {
      await (await clerkClient()).users.deleteUser(profile.clerk_user_id);
    } else if (profile.email) {
      const normalized = normalizeEmail(profile.email);
      if (normalized) await revokePendingInvitations(normalized);
    }
  } catch {
    return {
      ok: false,
      error: "Não foi possível excluir a conta vinculada do professor.",
    };
  }

  await supabase.from(TABLES.PROFILES).delete().eq("id", profile.id);

  revalidatePath(ROUTES.ADMIN.PROFESSORES);

  return { ok: true, message: "Professor removido." };
}

export async function updateProfessor(input: unknown): Promise<ActionResult> {
  const values = updateProfessorSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para atualizar o professor." };
  }

  const access = await assertAdminAccess();

  if ("error" in access) {
    return { ok: false, error: access.error ?? ACTION_ERRORS.NO_PERMISSION };
  }

  const supabase = createAdminClient();

  const { data: profileRaw } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .eq("id", values.data.profileId)
    .eq("role", ROLES.PROFESSOR)
    .maybeSingle();

  const profile = profileRaw as ProfileRow | null;

  if (!profile) {
    return { ok: false, error: "Professor não encontrado." };
  }

  const { error: updateError } = await supabase
    .from(TABLES.PROFILES)
    .update(
      asSupabaseUpdate<"profiles">({
        full_name: values.data.fullName,
        address: values.data.address ?? null,
      }),
    )
    .eq("id", profile.id);

  if (updateError) {
    return { ok: false, error: "Não foi possível atualizar o professor." };
  }

  // Sync name to Clerk if the professor has an active account
  if (profile.clerk_user_id) {
    try {
      const parts = values.data.fullName.split(/\s+/).filter(Boolean);
      await (
        await clerkClient()
      ).users.updateUser(profile.clerk_user_id, {
        firstName: parts[0],
        lastName: parts.slice(1).join(" ") || undefined,
      });
    } catch {
      // Non-fatal: profile already updated in DB
    }
  }

  revalidatePath(ROUTES.ADMIN.PROFESSORES);

  return { ok: true, message: "Professor atualizado." };
}
