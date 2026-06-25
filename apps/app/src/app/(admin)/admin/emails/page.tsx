import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAppSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";
import { getEmailsAction } from "@/lib/actions/emails";
import { EmailsClient } from "./emails-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Gestão de E-mails | Admin" };

export default async function EmailsPage() {
  const session = await getCurrentAppSession();

  if (!session || session.profile.role !== ROLES.ADMIN) {
    redirect(ROUTES.ADMIN.ALUNOS);
  }

  // Fetch all emails from database
  const emails = await getEmailsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Gestão de E-mails
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie e-mails enviados e recebidos através do seu domínio
          verificado da Resend.
        </p>
      </div>
      <EmailsClient initialEmails={emails} />
    </div>
  );
}
