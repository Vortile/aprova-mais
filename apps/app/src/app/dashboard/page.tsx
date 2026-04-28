import { redirect } from "next/navigation";
import { requireAppSession } from "@/lib/auth/session";
import { ROUTES } from "@/lib/routes";
import { ROLES } from "@/lib/supabase/env";

export default async function DashboardPage() {
  const session = await requireAppSession();

  if (session.profile.role === ROLES.ALUNO) {
    redirect(ROUTES.ALUNO.MATERIAIS);
  }

  redirect(ROUTES.ADMIN.ALUNOS);
}
