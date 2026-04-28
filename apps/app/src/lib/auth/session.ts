import "server-only";

import { redirect } from "next/navigation";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { TABLES, type Database } from "@repo/db";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getRoleFromMetadata,
  normalizeEmail,
  type AppRole,
  ROLES,
} from "@/lib/supabase/env";
import { asSupabaseInsert, asSupabaseUpdate } from "@/lib/supabase/typed";
import { ROUTES } from "@/lib/routes";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export type AppSession = {
  clerkUserId: string;
  email: string;
  name: string | null;
  profile: ProfileRow;
};

function getPrimaryEmail(user: ClerkUser) {
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );

  return normalizeEmail(
    primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress,
  );
}

function getDisplayName(user: ClerkUser) {
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.username || getPrimaryEmail(user);
}

async function findProfileByClerkOrEmail(
  clerkUserId: string,
  normalizedEmail: string | null,
) {
  const supabase = createAdminClient();

  const { data: byClerkRows } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .limit(1);

  const byClerk = (byClerkRows?.[0] as ProfileRow | undefined) ?? null;

  if (byClerk || !normalizedEmail) {
    return byClerk;
  }

  const { data: byEmailRows } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .ilike("email", normalizedEmail)
    .limit(1);

  return (byEmailRows?.[0] as ProfileRow | undefined) ?? null;
}

function inferRoleFromMetadata(user: ClerkUser): AppRole {
  return getRoleFromMetadata(user.privateMetadata, user.publicMetadata);
}

async function getAuthenticatedClerkUser(
  userId: string,
): Promise<ClerkUser | null> {
  const user = await currentUser();

  if (user) {
    return user;
  }

  try {
    const client = await clerkClient();
    return await client.users.getUser(userId);
  } catch {
    return null;
  }
}

async function linkAlunoProfile(
  profileId: string,
  normalizedEmail: string | null,
) {
  if (!normalizedEmail) {
    return;
  }

  const supabase = createAdminClient();

  await supabase
    .from(TABLES.ALUNOS)
    .update(
      asSupabaseUpdate<"alunos">({
        profile_id: profileId,
      }),
    )
    .ilike("contact_email", normalizedEmail)
    .is("profile_id", null);
}

export async function getCurrentAppSession(): Promise<AppSession | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await getAuthenticatedClerkUser(userId);

  if (!user) {
    return null;
  }

  const email = getPrimaryEmail(user);

  if (!email) {
    return null;
  }

  const name = getDisplayName(user);
  const supabase = createAdminClient();
  let profile = await findProfileByClerkOrEmail(userId, email);

  if (profile) {
    const nextRole = inferRoleFromMetadata(user);
    const shouldUpdate =
      profile.clerk_user_id !== userId ||
      normalizeEmail(profile.email) !== email ||
      profile.full_name !== name ||
      profile.role !== nextRole;

    if (shouldUpdate) {
      const { data } = await supabase
        .from(TABLES.PROFILES)
        .update(
          asSupabaseUpdate<"profiles">({
            clerk_user_id: userId,
            email,
            full_name: name,
            role: nextRole,
          }),
        )
        .eq("id", profile.id)
        .select("*")
        .single();

      profile = (data as ProfileRow | null) ?? profile;
    }
  } else {
    const role = inferRoleFromMetadata(user);
    const { data } = await supabase
      .from(TABLES.PROFILES)
      .insert(
        asSupabaseInsert<"profiles">({
          id: crypto.randomUUID(),
          clerk_user_id: userId,
          email,
          full_name: name,
          role,
        }),
      )
      .select("*")
      .single();

    profile = data as ProfileRow | null;
  }

  if (!profile) {
    return null;
  }

  await linkAlunoProfile(profile.id, email);

  return {
    clerkUserId: userId,
    email,
    name,
    profile,
  };
}

export async function requireAppSession() {
  const session = await getCurrentAppSession();

  if (!session) {
    redirect(ROUTES.SIGN_IN);
  }

  return session;
}

export async function requireRole(role: AppRole) {
  const session = await requireAppSession();

  if (session.profile.role !== role) {
    // Redirect to the appropriate home for the user's actual role
    const home =
      session.profile.role === ROLES.ALUNO
        ? ROUTES.ALUNO.MATERIAIS
        : ROUTES.ADMIN.ALUNOS;
    redirect(home);
  }

  return session;
}

/** Teachers and admins both have access to the admin panel */
export async function requireStaff() {
  const session = await requireAppSession();

  if (session.profile.role === ROLES.ALUNO) {
    redirect(ROUTES.ALUNO.MATERIAIS);
  }

  return session;
}
