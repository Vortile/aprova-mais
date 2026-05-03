import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/supabase/env";
import { TABLES } from "@repo/db";
import { AlunosClient } from "./alunos-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Alunos | Admin" };

const PLATFORM_STUDENT_LIMIT = 100;

export default async function AlunosPage() {
  const session = await getCurrentAppSession();
  const supabase = createAdminClient();

  const isProfessor = session?.profile.role === ROLES.PROFESSOR;

  let alunosQuery = supabase
    .from(TABLES.ALUNOS)
    .select("*, profiles(full_name, avatar_url, clerk_user_id)")
    .order("created_at", { ascending: false });

  if (isProfessor && session) {
    alunosQuery = alunosQuery.eq("professor_id", session.profile.id);
  }

  const [{ data: alunos }, { data: professors }] = await Promise.all([
    alunosQuery,
    supabase
      .from(TABLES.PROFILES)
      .select("id, full_name")
      .eq("role", ROLES.PROFESSOR)
      .order("full_name", { ascending: true }),
  ]);

  let studentCount: number | null = null;

  if (!isProfessor) {
    const { count } = await supabase
      .from(TABLES.PROFILES)
      .select("id", { count: "exact", head: true })
      .eq("role", ROLES.ALUNO)
      .not("clerk_user_id", "is", null);

    studentCount = count;
  }

  const count = studentCount ?? 0;
  const pct = Math.min(Math.round((count / PLATFORM_STUDENT_LIMIT) * 100), 100);
  const nearLimit = count >= 90;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alunos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isProfessor
            ? "Veja os alunos atribuídos a você."
            : "Gerencie os alunos cadastrados na plataforma."}
        </p>
      </div>

      {!isProfessor && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Alunos cadastrados</span>
            <span
              className={
                nearLimit ? "font-semibold text-destructive" : "font-medium"
              }
            >
              {count} / {PLATFORM_STUDENT_LIMIT}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${nearLimit ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {nearLimit && (
            <p className="text-xs text-destructive">
              Limite de alunos quase atingido. Para aumentar o limite, entre em
              contato com Luciano.
            </p>
          )}
        </div>
      )}

      <AlunosClient
        alunos={alunos ?? []}
        isAdmin={!isProfessor}
        professors={!isProfessor ? (professors ?? []) : []}
      />
    </div>
  );
}
