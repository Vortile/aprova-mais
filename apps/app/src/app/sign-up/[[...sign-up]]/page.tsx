import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { hasAppEnv } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Plataforma Aprova+",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!hasAppEnv()) {
    redirect(ROUTES.SETUP);
  }

  const params = await searchParams;
  const ticket =
    getSearchValue(params.__clerk_ticket) ??
    getSearchValue(params.__clerk_invitation_token);

  if (!ticket) {
    redirect(ROUTES.SIGN_IN);
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4">
      <SignUp
        path={ROUTES.SIGN_UP}
        routing="path"
        signInUrl={ROUTES.SIGN_IN}
        forceRedirectUrl={ROUTES.DASHBOARD}
      />
    </main>
  );
}
