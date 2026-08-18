import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAppSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";
import { getEventoDashboardData } from "@/lib/actions/eventos";
import { EventosClient } from "./eventos-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Eventos | Admin" };

const EVENTO_SLUG = "intensivao-enem-medicina-2026";

export default async function EventosPage() {
  const session = await getCurrentAppSession();
  if (!session || session.profile.role !== ROLES.ADMIN) {
    redirect(ROUTES.ADMIN.ALUNOS);
  }

  const data = await getEventoDashboardData(EVENTO_SLUG);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Funil de conversão, inscrições e check-in do Intensivão ENEM
            Medicina 2026.
          </p>
        </div>
        <Link
          href={ROUTES.ADMIN.EVENTOS_PREVIEW_EMAILS}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md border transition-colors self-start sm:self-auto shadow-sm"
        >
          📧 Visualizar Templates de E-mail →
        </Link>
      </div>
      {data ? (
        <EventosClient data={data} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Evento não encontrado. Verifique se a migração do banco de dados foi
          aplicada.
        </p>
      )}
    </div>
  );
}
