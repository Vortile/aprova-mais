import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TABLES, type Database } from "@repo/db";
import { getMaterialDownloadUrl } from "@/lib/materials";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";
import { TarefasClient } from "./tarefas-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tarefas | Admin" };

type MaterialRow = Pick<
  Database["public"]["Tables"]["materiais"]["Row"],
  "id" | "title" | "subject" | "file_url"
> & { download_url: string | null };
type AlunoOption = Pick<
  Database["public"]["Tables"]["alunos"]["Row"],
  "id" | "grade" | "contact_email"
> & {
  profiles: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "full_name"
  > | null;
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
> & {
  alunos: {
    id: string;
    contact_email: string | null;
    profiles: Pick<
      Database["public"]["Tables"]["profiles"]["Row"],
      "full_name"
    > | null;
  } | null;
};
type TarefaRow = Pick<
  Database["public"]["Tables"]["tarefas"]["Row"],
  "id" | "title" | "description" | "due_date" | "created_at"
> & {
  materiais: MaterialRow | null;
  tarefa_alunos: EntregaRow[] | null;
};

export default async function TarefasPage() {
  const session = await getCurrentAppSession();
  if (!session) redirect(ROUTES.SIGN_IN);
  if (session.profile.role === ROLES.ALUNO) redirect(ROUTES.ALUNO.HOME);

  const supabase = createAdminClient();
  const isAdmin = session.profile.role === ROLES.ADMIN;

  let tarefasQuery = supabase
    .from(TABLES.TAREFAS)
    .select(
      "id, title, description, due_date, created_at, materiais(id, title, subject, file_url), tarefa_alunos(id, status, student_notes, submission_url, submitted_at, reviewed_at, teacher_feedback, alunos(id, contact_email, profiles!alunos_profile_id_fkey(full_name)))",
    )
    .order("created_at", { ascending: false });

  let alunosQuery = supabase
    .from(TABLES.ALUNOS)
    .select(
      "id, grade, contact_email, profiles!alunos_profile_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false });

  let materiaisQuery = supabase
    .from(TABLES.MATERIAIS)
    .select("id, title, subject, file_url")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    tarefasQuery = tarefasQuery.eq("created_by", session.profile.id);
    alunosQuery = alunosQuery.eq("professor_id", session.profile.id);
    materiaisQuery = materiaisQuery.eq("uploaded_by", session.profile.id);
  }

  const [{ data: tarefas }, { data: alunos }, { data: materiais }] =
    await Promise.all([tarefasQuery, alunosQuery, materiaisQuery]);

  const tarefasWithUrls = await Promise.all(
    ((tarefas ?? []) as TarefaRow[]).map(async (tarefa) => ({
      ...tarefa,
      materiais: tarefa.materiais
        ? {
            ...tarefa.materiais,
            download_url: await getMaterialDownloadUrl(
              tarefa.materiais.file_url,
            ),
          }
        : null,
    })),
  );

  const materiaisWithUrls = await Promise.all(
    (
      (materiais ?? []) as Array<
        Database["public"]["Tables"]["materiais"]["Row"]
      >
    ).map(async (material) => ({
      id: material.id,
      title: material.title,
      subject: material.subject,
      file_url: material.file_url,
      download_url: await getMaterialDownloadUrl(material.file_url),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tarefas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie tarefas, acompanhe entregas e devolva feedback para cada aluno.
        </p>
      </div>
      <TarefasClient
        tarefas={tarefasWithUrls}
        alunos={(alunos ?? []) as AlunoOption[]}
        materiais={materiaisWithUrls}
        isAdmin={isAdmin}
      />
    </div>
  );
}
