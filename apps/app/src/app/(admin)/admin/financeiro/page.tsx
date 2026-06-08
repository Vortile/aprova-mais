import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";
import { TABLES } from "@repo/db";
import { FinanceiroClient } from "./financeiro-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Financeiro | Admin" };

export default async function FinanceiroPage() {
  const session = await getCurrentAppSession();
  if (!session || session.profile.role !== ROLES.ADMIN) {
    redirect(ROUTES.ADMIN.ALUNOS);
  }

  const supabase = createAdminClient();

  const [{ data: registros }, { data: alunos }] = await Promise.all([
    supabase
      .from(TABLES.FINANCEIRO)
      .select("*, alunos(grade, contact_email, profiles!alunos_profile_id_fkey(full_name))")
      .order("due_date", { ascending: false }),
    supabase
      .from(TABLES.ALUNOS)
      .select("id, monthly_amount, contact_email, profiles!alunos_profile_id_fkey(full_name)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe os pagamentos e a projeção mensal das mensalidades ativas.
        </p>
      </div>
      <FinanceiroClient registros={registros ?? []} alunos={alunos ?? []} />
    </div>
  );
}
