import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";
import { getCurrentAppSession } from "@/lib/auth/session";
import { ROUTES } from "@/lib/routes";
import { ROLES } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Criar Conta | Aprova+",
};

type Params = Promise<{ cadastro?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CadastroPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const isRoot = !params.cadastro || params.cadastro.length === 0;
  const hasTicket =
    !!searchParams.__clerk_ticket || !!searchParams.__clerk_invitation_token;

  // Only allow access to the root signup page if they have a valid invite ticket
  if (isRoot && !hasTicket) {
    redirect(ROUTES.SIGN_IN);
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
      <a
        href="https://aprovamaiscurso-pro.com.br"
        className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-black/5 hover:text-stone-900"
      >
        <ArrowLeft className="size-3.5" />
        Voltar ao site
      </a>
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
        <SignUp
          appearance={{
            elements: {
              card: "border border-black/5 bg-white/90 shadow-xl backdrop-blur-sm",
            },
          }}
          path={ROUTES.SIGN_UP}
          routing="path"
          signInUrl={ROUTES.SIGN_IN}
          forceRedirectUrl={ROUTES.DASHBOARD}
        />
      </div>
    </main>
  );
}
