import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";
import { TABLES } from "@repo/db";
import { DepoimentosClient } from "./depoimentos-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Depoimentos | Admin" };

export default async function DepoimentosPage() {
  const session = await getCurrentAppSession();
  if (!session || session.profile.role !== ROLES.ADMIN) {
    redirect(ROUTES.ADMIN.ALUNOS);
  }

  const { data: depoimentos } = await createAdminClient()
    .from(TABLES.DEPOIMENTOS)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Depoimentos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os depoimentos exibidos na seção &ldquo;O que as famílias
          dizem&rdquo; do site. Máximo de 3 depoimentos.
        </p>
      </div>
      <DepoimentosClient depoimentos={depoimentos ?? []} />
    </div>
  );
}
