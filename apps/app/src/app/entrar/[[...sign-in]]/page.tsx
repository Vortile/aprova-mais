import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { BrandLockup } from "@/components/brand-lockup";
import { getCurrentAppSession } from "@/lib/auth/session";
import { hasAppEnv } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";
import { ROLES } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Plataforma Aprova+",
};

export default async function EntrarPage() {
  if (!hasAppEnv()) {
    redirect(ROUTES.SETUP);
  }

  const session = await getCurrentAppSession();

  if (session) {
    if (session.profile.role === ROLES.ALUNO) {
      redirect(ROUTES.ALUNO.MATERIAIS);
    }

    redirect(ROUTES.ADMIN.ALUNOS);
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#f5f1e8] p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,241,232,0.18),rgba(245,241,232,0.78)_48%,rgba(245,241,232,0.94)_100%)]"
      />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-5">
        <BrandLockup
          size="lg"
          priority
          className="drop-shadow-[0_8px_30px_rgba(48,78,112,0.08)]"
        />
        <SignIn
          appearance={{
            elements: {
              card: "border border-black/5 bg-white/90 shadow-xl backdrop-blur-sm",
              footerAction: "hidden",
            },
          }}
          path={ROUTES.SIGN_IN}
          routing="path"
          withSignUp={false}
          forceRedirectUrl={ROUTES.DASHBOARD}
        />
      </div>
    </main>
  );
}
