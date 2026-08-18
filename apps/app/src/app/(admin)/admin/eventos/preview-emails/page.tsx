import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAppSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";
import { PreviewEmailsAdminClient } from "./preview-emails-client";

export const metadata: Metadata = {
  title: "Visualizador de E-mails | Admin",
  description:
    "Preview e disparo de testes dos e-mails transacionais e régua Drip do Intensivão ENEM Medicina 2026.",
};

export default async function AdminPreviewEmailsPage() {
  const session = await getCurrentAppSession();
  if (!session || session.profile.role !== ROLES.ADMIN) {
    redirect(ROUTES.ADMIN.ALUNOS);
  }

  return <PreviewEmailsAdminClient />;
}
