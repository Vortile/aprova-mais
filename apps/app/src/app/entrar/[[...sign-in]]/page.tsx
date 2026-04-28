import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { hasAppEnv } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Entrar | Plataforma do Professor",
};

export default function EntrarPage() {
  if (!hasAppEnv()) {
    redirect(ROUTES.SETUP);
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4">
      <SignIn
        path={ROUTES.SIGN_IN}
        routing="path"
        withSignUp={false}
        forceRedirectUrl={ROUTES.DASHBOARD}
      />
    </main>
  );
}