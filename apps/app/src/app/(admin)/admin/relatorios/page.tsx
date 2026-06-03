import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TABLES } from "@repo/db";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";
import { RelatoriosClient } from "./relatorios-client";
import type { ChartDataPoint } from "./relatorios-chart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Relatórios | Admin" };

type Props = { searchParams: Promise<{ alunoId?: string }> };

export default async function RelatoriosPage({ searchParams }: Props) {
  const { alunoId } = await searchParams;

  const session = await getCurrentAppSession();

  if (!session) redirect(ROUTES.SIGN_IN);
  if (session.profile.role === ROLES.ALUNO) redirect(ROUTES.ALUNO.HOME);

  const supabase = createAdminClient();
  const isAdmin = session.profile.role === ROLES.ADMIN;
  const professorId = session.profile.id;

  // Admins see all alunos; professors see only their own
  const alunosQuery = supabase
    .from(TABLES.ALUNOS)
    .select("id, contact_email, profiles!alunos_profile_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    alunosQuery.eq("professor_id", professorId);
  }

  const { data: alunos } = await alunosQuery;
  const alunoList = (alunos ?? []) as {
    id: string;
    contact_email: string | null;
    profiles: { full_name: string | null } | null;
  }[];

  // Validate selected aluno belongs to visible list
  const selectedAlunoId =
    alunoId && alunoList.some((a) => a.id === alunoId) ? alunoId : null;

  // Fetch chart data for selected aluno
  let chartData: ChartDataPoint[] = [];

  type ListaRow = { data_aula: string; quantidade_acertos: number; total_questoes: number };
  type ProvaRow = { data_prova: string; nota: number; nota_maxima: number };
  type RelatorioRow = { created_at: string; engajamento: number | null };

  if (selectedAlunoId) {
    const [{ data: rawListas }, { data: rawProvas }, { data: rawRelatorios }] =
      await Promise.all([
        supabase
          .from(TABLES.REGISTROS_LISTA)
          .select("data_aula, quantidade_acertos, total_questoes")
          .eq("aluno_id", selectedAlunoId)
          .order("data_aula", { ascending: true }),
        supabase
          .from(TABLES.NOTAS_PROVAS)
          .select("data_prova, nota, nota_maxima")
          .eq("aluno_id", selectedAlunoId)
          .order("data_prova", { ascending: true }),
        supabase
          .from(TABLES.RELATORIOS_PEDAGOGICOS)
          .select("created_at, engajamento")
          .eq("aluno_id", selectedAlunoId)
          .not("engajamento", "is", null)
          .order("created_at", { ascending: true }),
      ]);

    const listas = rawListas as ListaRow[] | null;
    const provas = rawProvas as ProvaRow[] | null;
    const relatorios = rawRelatorios as RelatorioRow[] | null;

    const pointMap = new Map<string, ChartDataPoint>();

    function getOrCreate(date: Date): ChartDataPoint {
      const label = `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      if (!pointMap.has(label)) {
        pointMap.set(label, { date: label, dateMs: date.getTime() });
      }
      return pointMap.get(label)!;
    }

    for (const row of listas ?? []) {
      const dt = new Date(row.data_aula);
      const pct =
        row.total_questoes > 0
          ? Math.round((row.quantidade_acertos / row.total_questoes) * 100)
          : 0;
      const pt = getOrCreate(dt);
      pt.listas =
        pt.listas !== undefined
          ? Math.round((pt.listas + pct) / 2)
          : pct;
    }

    for (const row of provas ?? []) {
      const dt = new Date(row.data_prova);
      const pct =
        row.nota_maxima > 0
          ? Math.round((row.nota / row.nota_maxima) * 100)
          : 0;
      const pt = getOrCreate(dt);
      pt.provas =
        pt.provas !== undefined
          ? Math.round((pt.provas + pct) / 2)
          : pct;
    }

    for (const row of relatorios ?? []) {
      const dt = new Date(row.created_at);
      const pt = getOrCreate(dt);
      pt.engajamento = row.engajamento as number;
    }

    chartData = Array.from(pointMap.values()).sort(
      (a, b) => a.dateMs - b.dateMs
    );
  }

  return (
    <RelatoriosClient
      alunos={alunoList}
      selectedAlunoId={selectedAlunoId}
      chartData={chartData}
    />
  );
}

