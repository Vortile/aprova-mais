import type { Metadata } from "next";
import { TABLES, type Database } from "@repo/db";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth/session";
import { getMaterialDownloadUrl } from "@/lib/materials";
import { createAdminClient } from "@/lib/supabase/admin";
import { AlunoTarefasClient } from "./tarefas-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tarefas | Aluno" };

type MaterialRow = Pick<
  Database["public"]["Tables"]["materiais"]["Row"],
  "id" | "title" | "subject" | "file_url"
> & { download_url: string | null };
type TarefaRow = Pick<
  Database["public"]["Tables"]["tarefas"]["Row"],
  "id" | "title" | "description" | "due_date"
> & {
  materiais: MaterialRow | null;
};
type EntregaRow = Pick<
  Database["public"]["Tables"]["tarefa_alunos"]["Row"],
  | "id"
  | "status"
  | "student_notes"
  | "submission_url"
  | "submitted_at"
  | "reviewed_at"
  | "teacher_feedback"
  | "created_at"
> & {
  tarefas: TarefaRow | null;
};

export default async function AlunoTarefasPage() {
  const session = await requireRole("aluno");
  const supabase = createAdminClient();

  const { data: alunoRows } = await supabase
    .from(TABLES.ALUNOS)
    .select("id")
    .eq("profile_id", session.profile.id)
    .limit(1);

  const alunoId = (alunoRows?.[0] as { id: string } | undefined)?.id;

  if (!alunoId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tarefas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu cadastro ainda não está vinculado a um aluno ativo.
          </p>
        </div>
      </div>
    );
  }

  const { data: entregas } = await supabase
    .from(TABLES.TAREFA_ALUNOS)
    .select(
      "id, status, student_notes, submission_url, submitted_at, reviewed_at, teacher_feedback, created_at, tarefas(id, title, description, due_date, materiais(id, title, subject, file_url))",
    )
    .eq("aluno_id", alunoId)
    .order("created_at", { ascending: false });

  const entregasWithUrls = await Promise.all(
    ((entregas ?? []) as EntregaRow[]).map(async (entrega) => ({
      ...entrega,
      tarefas: entrega.tarefas
        ? {
            ...entrega.tarefas,
            materiais: entrega.tarefas.materiais
              ? {
                  ...entrega.tarefas.materiais,
                  download_url: await getMaterialDownloadUrl(
                    entrega.tarefas.materiais.file_url,
                  ),
                }
              : null,
          }
        : null,
    })),
  );

  return (
    <Suspense fallback={<div>Carregando tarefas...</div>}>
      <AlunoTarefasClient entregas={entregasWithUrls} />
    </Suspense>
  );
}
