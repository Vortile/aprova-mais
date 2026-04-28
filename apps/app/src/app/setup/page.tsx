import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hasAppEnv } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Plataforma Aprova+",
};

export default function SetupPage() {
  if (hasAppEnv()) {
    redirect(ROUTES.DASHBOARD);
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl border-border/60 shadow-sm">
        <CardHeader className="space-y-3">
          <Badge variant="secondary" className="w-fit text-xs">
            Configuração pendente
          </Badge>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            A plataforma precisa do banco e do Clerk conectados para funcionar.
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            Para liberar login, middleware e os painéis de admin e aluno, crie o
            arquivo <strong>apps/app/.env.local</strong> usando o modelo de
            <strong> apps/app/.env.example</strong> e preencha as chaves do
            Clerk e do projeto Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-lg border bg-background p-4 font-mono text-xs leading-6 text-foreground">
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
            <br />
            CLERK_SECRET_KEY=
            <br />
            NEXT_PUBLIC_SUPABASE_URL=
            <br />
            SUPABASE_SERVICE_ROLE_KEY=
            <br />
            NEXT_PUBLIC_APP_URL=
          </div>
          <p>
            Depois disso, reinicie <strong>pnpm --filter @repo/app dev</strong>.
            O login com Clerk e o acesso ao banco passam a funcionar sem mais
            mudanças no código.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
