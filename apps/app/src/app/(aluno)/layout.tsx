import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { hasAppEnv } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";
import { StudentSidebar } from "@/components/student-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasAppEnv()) {
    redirect(ROUTES.SETUP);
  }

  const session = await requireRole("aluno");

  return (
    <SidebarProvider>
      <StudentSidebar
        userName={session.profile.full_name}
        userEmail={session.email}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
            style={{ backgroundImage: "url('/background.jpg')" }}
          />
          <div className="relative z-10 flex flex-1 flex-col gap-4 p-4 md:p-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
