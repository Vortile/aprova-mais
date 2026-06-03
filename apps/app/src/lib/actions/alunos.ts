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

const saveAlunoSchema = z.object({
  alunoId: z.string().uuid().optional(),
  fullName: z.string().trim(),
  contactEmail: z
    .string()
    .trim()
    .email("Informe um email válido")
    .or(z.literal("")),
  monthlyAmount: z.string().trim().optional(),
  address: z.string().trim().optional(),
  grade: z.string().trim().min(1, "Informe a série"),
  subjectFocus: z.string().trim(),
  notes: z.string().trim(),
  professorId: z.string().uuid().nullable().optional(),
});

const alunoIdSchema = z.string().uuid();

type SaveAlunoResult =
  | { ok: true; message: string }
  | { ok: false; error: string };
type DeleteAlunoResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AlunoRow = Database["public"]["Tables"]["alunos"]["Row"];
type AlunoWithProfileRow = Pick<
  AlunoRow,
  "id" | "profile_id" | "contact_email"
> & {
  profiles: Pick<
    ProfileRow,
    "id" | "clerk_user_id" | "email" | "full_name" | "role"
  > | null;
};
type ClerkUserRecord = {
  id: string;
  primaryEmailAddressId: string | null;
  publicMetadata: Record<string, unknown>;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
  }>;
};

async function assertStaffAccess() {
  const session = await getCurrentAppSession();

  if (!session) {
    return { error: ACTION_ERRORS.SESSION_EXPIRED } as const;
  }

  if (
    session.profile.role !== ROLES.ADMIN &&
    session.profile.role !== ROLES.PROFESSOR
  ) {
    return {
      error: "Apenas professores e administradores podem gerenciar alunos.",
    } as const;
  }

  return { session } as const;
}

function splitFullName(fullName: string | null) {
  if (!fullName) {
    return {};
  }

  const parts = fullName.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {};
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || undefined,
  };
}

function getPrimaryEmail(user: ClerkUserRecord) {
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );

  return normalizeEmail(
    primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress,
  );
}

function isStudentRole(value: unknown) {
  return value === ROLES.ALUNO;
}

async function getAppOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function findAluno(alunoId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLES.ALUNOS)
    .select(
      "id, profile_id, contact_email, profiles(id, clerk_user_id, email, full_name, role)",
    )
    .eq("id", alunoId)
    .single();

  if (error) {
    return null;
  }

  return data as AlunoWithProfileRow | null;
}

async function findProfileByEmail(normalizedEmail: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .ilike("email", normalizedEmail)
    .limit(1);

  return (data?.[0] as ProfileRow | undefined) ?? null;
}

async function findProfileByClerkUserId(clerkUserId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .limit(1);

  return (data?.[0] as ProfileRow | undefined) ?? null;
}

async function upsertAlunoProfile({
  currentProfileId,
  normalizedEmail,
  fullName,
  clerkUserId,
}: {
  currentProfileId: string | null;
  normalizedEmail: string;
  fullName: string | null;
  clerkUserId: string | null;
}) {
  const supabase = createAdminClient();

  if (currentProfileId) {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update(
        asSupabaseUpdate<"profiles">({
          clerk_user_id: clerkUserId,
          email: normalizedEmail,
          full_name: fullName,
          role: "aluno",
        }),
      )
      .eq("id", currentProfileId)
      .select("*")
      .single();

    if (error || !data) {
      return null;
    }

    return data as ProfileRow;
  }

  const byClerkUser = clerkUserId
    ? await findProfileByClerkUserId(clerkUserId)
    : null;
  const byEmail = byClerkUser
    ? null
    : await findProfileByEmail(normalizedEmail);
  const existingProfile = byClerkUser ?? byEmail;

  if (existingProfile) {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update(
        asSupabaseUpdate<"profiles">({
          clerk_user_id: clerkUserId,
          email: normalizedEmail,
          full_name: fullName,
          role: "aluno",
        }),
      )
      .eq("id", existingProfile.id)
      .select("*")
      .single();

    if (error || !data) {
      return null;
    }

    return data as ProfileRow;
  }

  const { data, error } = await supabase
    .from(TABLES.PROFILES)
    .insert(
      asSupabaseInsert<"profiles">({
        id: crypto.randomUUID(),
        clerk_user_id: clerkUserId,
        email: normalizedEmail,
        full_name: fullName,
        role: "aluno",
      }),
    )
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return data as ProfileRow;
}

async function findClerkUserByEmail(normalizedEmail: string) {
  const client = await clerkClient();
  const response = await client.users.getUserList({
    emailAddress: [normalizedEmail],
    limit: 1,
  });

  return (response.data[0] as ClerkUserRecord | undefined) ?? null;
}

async function getClerkUser(userId: string) {
  try {
    return (await (
      await clerkClient()
    ).users.getUser(userId)) as unknown as ClerkUserRecord;
  } catch {
    return null;
  }
}

async function syncClerkUser({
  user,
  normalizedEmail,
  fullName,
}: {
  user: ClerkUserRecord;
  normalizedEmail: string;
  fullName: string | null;
}) {
  const client = await clerkClient();

  if (getPrimaryEmail(user) !== normalizedEmail) {
    const existingAddress = user.emailAddresses.find(
      (address) => normalizeEmail(address.emailAddress) === normalizedEmail,
    );

    if (existingAddress) {
      await client.emailAddresses.updateEmailAddress(existingAddress.id, {
        verified: true,
        primary: true,
      });
    } else {
      await client.emailAddresses.createEmailAddress({
        userId: user.id,
        emailAddress: normalizedEmail,
        verified: true,
        primary: true,
      });
    }
  }

  await client.users.updateUser(user.id, {
    ...splitFullName(fullName),
    privateMetadata: { role: "aluno" },
  });
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
        (invitation) =>
          normalizeEmail(invitation.emailAddress) === normalizedEmail &&
          invitation.status === "pending",
      )
      .map((invitation) => client.invitations.revokeInvitation(invitation.id)),
  );
}

async function createAlunoInvitation(
  normalizedEmail: string,
  fullName: string | null,
) {
  const client = await clerkClient();

  await revokePendingInvitations(normalizedEmail);

  // publicMetadata.role is a hint for the invitation flow.
  // When the student signs up and an admin saves their record,
  // privateMetadata.role will be set authoritatively via syncClerkUser.
  await client.invitations.createInvitation({
    emailAddress: normalizedEmail,
    ignoreExisting: true,
    notify: true,
    publicMetadata: {
      role: "aluno",
      ...(fullName ? { full_name: fullName } : {}),
    },
    redirectUrl: `${await getAppOrigin()}/sign-up`,
  });
}

function getSubjectList(subjectFocus: string) {
  return subjectFocus
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
}

export async function saveAluno(input: unknown): Promise<SaveAlunoResult> {
  const values = saveAlunoSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para salvar o aluno." };
  }

  const adminAccess = await assertStaffAccess();

  if ("error" in adminAccess) {
    return {
      ok: false,
      error: adminAccess.error ?? "Acesso administrativo inválido.",
    };
  }

  const { session } = adminAccess;

  if (session.profile.role === ROLES.PROFESSOR && !values.data.alunoId) {
    return {
      ok: false,
      error: "Apenas administradores podem adicionar novos alunos.",
    };
  }

  const normalizedEmail = normalizeEmail(values.data.contactEmail) || null;
  const fullName = values.data.fullName || null;
  const monthlyAmount = values.data.monthlyAmount
    ? parseFloat(values.data.monthlyAmount)
    : null;
  const address = values.data.address || null;
  const subjectFocus = getSubjectList(values.data.subjectFocus);
  const supabase = createAdminClient();

  let currentAluno: AlunoWithProfileRow | null = null;

  if (values.data.alunoId) {
    currentAluno = await findAluno(values.data.alunoId);

    if (!currentAluno) {
      return { ok: false, error: "Aluno não encontrado para edição." };
    }

    // Only require email if the profile already has one (e.g. invitation sent or active account).
    // Name-only profiles (no email) can be edited freely without providing an email.
    if (
      currentAluno.profile_id &&
      !normalizedEmail &&
      (currentAluno.profiles?.email || currentAluno.profiles?.clerk_user_id)
    ) {
      return {
        ok: false,
        error: "Informe o email da conta vinculada para continuar.",
      };
    }
  }

  // ─── Step 1: read-only Clerk lookups (no mutations yet) ──────────────────
  let clerkUser: ClerkUserRecord | null = null;

  if (normalizedEmail) {
    const emailProfile = await findProfileByEmail(normalizedEmail);

    if (
      emailProfile &&
      emailProfile.role !== "aluno" &&
      emailProfile.id !== currentAluno?.profile_id
    ) {
      return {
        ok: false,
        error: "Este email já pertence a uma conta que não é de aluno.",
      };
    }

    const currentClerkUser = currentAluno?.profiles?.clerk_user_id
      ? await getClerkUser(currentAluno.profiles.clerk_user_id)
      : null;
    const matchedClerkUser = await findClerkUserByEmail(normalizedEmail);

    if (
      matchedClerkUser &&
      currentClerkUser &&
      matchedClerkUser.id !== currentClerkUser.id
    ) {
      return {
        ok: false,
        error: "Já existe outra conta Clerk usando este email.",
      };
    }

    if (
      matchedClerkUser &&
      !isStudentRole(matchedClerkUser.publicMetadata.role) &&
      !isStudentRole(
        (
          matchedClerkUser as unknown as {
            privateMetadata: Record<string, unknown>;
          }
        ).privateMetadata?.role,
      )
    ) {
      return {
        ok: false,
        error: "Este email já pertence a uma conta que não é de aluno.",
      };
    }

    clerkUser = currentClerkUser ?? matchedClerkUser;
  }

  // ─── Step 2: all DB writes ────────────────────────────────────────────────
  let profileId = currentAluno?.profile_id ?? null;

  if (normalizedEmail) {
    // Upsert profile with clerk_user_id if we already know it (existing user).
    // For new invites clerkUser is null — profile is created without clerk_user_id
    // ("Convite pendente") and linked later when the student signs up.
    const profile = await upsertAlunoProfile({
      currentProfileId: currentAluno?.profile_id ?? null,
      normalizedEmail,
      fullName,
      clerkUserId: clerkUser?.id ?? null,
    });

    if (!profile) {
      return {
        ok: false,
        error:
          "Não foi possível preparar o perfil do aluno para a conta informada.",
      };
    }

    profileId = profile.id;
  } else if (currentAluno?.profile_id) {
    const { error } = await supabase
      .from(TABLES.PROFILES)
      .update(asSupabaseUpdate<"profiles">({ full_name: fullName }))
      .eq("id", currentAluno.profile_id);

    if (error) {
      return {
        ok: false,
        error: "Não foi possível atualizar o perfil do aluno.",
      };
    }
  } else if (fullName) {
    // New student without email: create a name-only profile so the name is
    // stored immediately and the student is visible everywhere in the admin.
    const { data: newProfile, error: profileError } = await supabase
      .from(TABLES.PROFILES)
      .insert(
        asSupabaseInsert<"profiles">({
          id: crypto.randomUUID(),
          clerk_user_id: null,
          full_name: fullName,
          role: "aluno",
        }),
      )
      .select("id")
      .single();

    if (profileError) {
      console.error("[saveAluno] failed to create name-only profile", { profileError });
      return {
        ok: false,
        error: `DB profile error: ${profileError.message ?? profileError.code ?? JSON.stringify(profileError)}`,
      };
    } else if (newProfile) {
      profileId = (newProfile as { id: string }).id;
    }
  }

  if (values.data.alunoId) {
    const { error } = await supabase
      .from(TABLES.ALUNOS)
      .update(
        asSupabaseUpdate<"alunos">({
          profile_id: profileId,
          monthly_amount: monthlyAmount,
          address: address,
          contact_email: normalizedEmail,
          grade: values.data.grade,
          subject_focus: subjectFocus,
          notes: values.data.notes,
          // Only admins can reassign the responsible professor
          ...(session.profile.role === ROLES.ADMIN &&
          values.data.professorId !== undefined
            ? { professor_id: values.data.professorId }
            : {}),
        }),
      )
      .eq("id", values.data.alunoId);

    if (error) {
      return { ok: false, error: "Não foi possível atualizar o aluno." };
    }
  } else {
    const { error } = await supabase.from(TABLES.ALUNOS).insert(
      asSupabaseInsert<"alunos">({
        profile_id: profileId,
        monthly_amount: monthlyAmount,
        address: address,
        contact_email: normalizedEmail,
        grade: values.data.grade,
        subject_focus: subjectFocus,
        notes: values.data.notes,
        professor_id: values.data.professorId ?? null,
      }),
    );

    if (error) {
      console.error("[saveAluno] failed to create aluno", {
        error,
        profileId,
        monthlyAmount,
        normalizedEmail,
        grade: values.data.grade,
        subjectFocus,
      });
      return { ok: false, error: "Não foi possível criar o aluno." };
    }
  }

  // ─── Step 3: Clerk mutations — only after all DB writes succeeded ─────────
  // If this fails the student record already exists in the DB and the admin
  // can simply save again to re-trigger the invite / sync.
  let successMessage = values.data.alunoId
    ? "Aluno atualizado."
    : "Aluno criado.";

  if (normalizedEmail) {
    try {
      if (clerkUser) {
        await syncClerkUser({ user: clerkUser, normalizedEmail, fullName });
        successMessage = currentAluno?.profile_id
          ? "Conta do aluno atualizada."
          : "Conta existente vinculada ao aluno.";
      } else {
        await createAlunoInvitation(normalizedEmail, fullName);
        successMessage = "Convite enviado ao aluno.";
      }
    } catch {
      // Clerk failed after the DB already committed — non-fatal.
      // The student record is saved; the admin can re-save to retry the invite.
      successMessage = values.data.alunoId
        ? "Aluno atualizado, mas o envio do convite falhou. Salve novamente para reenviar."
        : "Aluno criado, mas o envio do convite falhou. Salve novamente para reenviar.";
    }
  }

  revalidatePath(ROUTES.ADMIN.ALUNOS);
  return { ok: true, message: successMessage };
}

export async function deleteAluno(alunoId: string): Promise<DeleteAlunoResult> {
  if (!alunoIdSchema.safeParse(alunoId).success) {
    return { ok: false, error: "Aluno inválido para exclusão." };
  }

  const adminAccess = await assertStaffAccess();

  if ("error" in adminAccess) {
    return {
      ok: false,
      error: adminAccess.error ?? "Acesso administrativo inválido.",
    };
  }

  const aluno = await findAluno(alunoId);

  if (!aluno) {
    return { ok: false, error: "Aluno não encontrado." };
  }

  const supabase = createAdminClient();

  try {
    if (aluno.profiles?.clerk_user_id) {
      await (
        await clerkClient()
      ).users.deleteUser(aluno.profiles.clerk_user_id);
    } else if (aluno.contact_email) {
      const normalizedEmail = normalizeEmail(aluno.contact_email);

      if (normalizedEmail) {
        await revokePendingInvitations(normalizedEmail);
      }
    }
  } catch {
    return {
      ok: false,
      error: "Não foi possível excluir a conta vinculada do aluno.",
    };
  }

  const { error: deleteAlunoError } = await supabase
    .from(TABLES.ALUNOS)
    .delete()
    .eq("id", alunoId);

  if (deleteAlunoError) {
    return {
      ok: false,
      error: "Não foi possível excluir o cadastro do aluno.",
    };
  }

  if (aluno.profile_id) {
    await supabase.from(TABLES.PROFILES).delete().eq("id", aluno.profile_id);
  }

  revalidatePath(ROUTES.ADMIN.ALUNOS);

  return {
    ok: true,
    message: aluno.profile_id
      ? "Aluno e conta vinculada excluídos."
      : "Aluno excluído.",
  };
}

export async function resendAlunoInvite(
  alunoId: string,
): Promise<SaveAlunoResult> {
  if (!alunoIdSchema.safeParse(alunoId).success) {
    return { ok: false, error: "Aluno inválido." };
  }

  const access = await assertStaffAccess();

  if ("error" in access) {
    return { ok: false, error: access.error ?? ACTION_ERRORS.NO_PERMISSION };
  }

  const aluno = await findAluno(alunoId);

  if (!aluno) {
    return { ok: false, error: "Aluno não encontrado." };
  }

  if (aluno.profiles?.clerk_user_id) {
    return {
      ok: false,
      error:
        "Este aluno já possui uma conta ativa. O convite não é necessário.",
    };
  }

  if (!aluno.contact_email) {
    return {
      ok: false,
      error: "Este aluno não possui email cadastrado para receber o convite.",
    };
  }

  const normalizedEmail = normalizeEmail(aluno.contact_email);

  if (!normalizedEmail) {
    return { ok: false, error: "O email cadastrado é inválido." };
  }

  try {
    await createAlunoInvitation(
      normalizedEmail,
      aluno.profiles?.full_name ?? null,
    );
  } catch {
    return { ok: false, error: "Não foi possível reenviar o convite." };
  }

  return { ok: true, message: "Convite reenviado com sucesso." };
}
