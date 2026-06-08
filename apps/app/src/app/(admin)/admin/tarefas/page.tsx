import type { Metadata } from "next";
import { TABLES, type Database } from "@repo/db";
import { getMaterialDownloadUrl } from "@/lib/materials";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const supabase = createAdminClient();

  const [{ data: tarefas }, { data: alunos }, { data: materiais }] =
    await Promise.all([
      supabase
        .from(TABLES.TAREFAS)
        .select(
          "id, title, description, due_date, created_at, materiais(id, title, subject, file_url), tarefa_alunos(id, status, student_notes, submission_url, submitted_at, reviewed_at, teacher_feedback, alunos(id, contact_email, profiles!alunos_profile_id_fkey(full_name)))",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from(TABLES.ALUNOS)
        .select("id, grade, contact_email, profiles!alunos_profile_id_fkey(full_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from(TABLES.MATERIAIS)
        .select("id, title, subject, file_url")
        .order("created_at", { ascending: false }),
    ]);

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
      />
    </div>
  );
}
