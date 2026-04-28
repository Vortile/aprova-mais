"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace(ROUTES.SIGN_IN);
      return;
    }

    const role = (user.publicMetadata?.role as string | undefined) ?? "aluno";

    if (role === "admin" || role === "professor") {
      router.replace("/admin/alunos");
    } else {
      router.replace("/aluno/materiais");
    }
  }, [isLoaded, user, router]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
