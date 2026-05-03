import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  RotateCcw,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMaterialDownloadUrl } from "@/lib/materials";
import { ROUTES } from "@/lib/routes";
import { TABLES } from "@repo/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Início | Aluno" };

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

function formatDate(value: string | null | undefined) {
  if (!value) return "Sem prazo";
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

function getDaysUntil(dueDate: string | null | undefined) {
  if (!dueDate) return null;
  const diff = new Date(`${dueDate}T23:59:59`).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusMeta(
  status: string,
  dueDate: string | null | undefined,
): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  icon: React.ElementType;
} {
  const isLate =
    Boolean(dueDate) &&
    ["pendente", "em_andamento"].includes(status) &&
    new Date(`${dueDate}T23:59:59`).getTime() < Date.now();

  if (isLate) return { label: "Atrasada", variant: "destructive", icon: Clock };
  if (status === "revisado")
    return { label: "Revisada", variant: "default", icon: CheckCircle2 };
  if (status === "entregue")
    return { label: "Entregue", variant: "secondary", icon: CheckCircle2 };
  if (status === "em_andamento")
    return { label: "Em andamento", variant: "outline", icon: RotateCcw };
  return { label: "Pendente", variant: "outline", icon: ClipboardList };
}

export default async function AlunoHomePage() {
  const session = await requireRole("aluno");
  const supabase = createAdminClient();

  // Resolve aluno record
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
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {session.profile.full_name?.split(" ")[0] ?? "Aluno"}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seu cadastro ainda não está vinculado a um aluno ativo.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  // Parallel queries
  const [entregasResult, upcomingResult, materiaisResult] = await Promise.all([
    // All entregas for stat cards
    supabase
      .from(TABLES.TAREFA_ALUNOS)
      .select("id, status, tarefas(due_date)")
      .eq("aluno_id", alunoId),
    // Upcoming/active tasks — pendente or em_andamento, ordered by due_date
    supabase
      .from(TABLES.TAREFA_ALUNOS)
      .select("id, status, tarefas(id, title, due_date)")
      .eq("aluno_id", alunoId)
      .in("status", ["pendente", "em_andamento"])
      .order("created_at", { ascending: true })
      .limit(5),
    // Latest 3 materials
    supabase
      .from(TABLES.ALUNO_MATERIAIS)
      .select(
        "material_id, assigned_at, materiais(id, title, subject, grade_level, file_url)",
      )
      .eq("aluno_id", alunoId)
      .order("assigned_at", { ascending: false })
      .limit(3),
  ]);

  type EntregaStats = {
    id: string;
    status: string;
    tarefas: { due_date: string | null } | null;
  };
  type UpcomingEntrega = {
    id: string;
    status: string;
    tarefas: { id: string; title: string; due_date: string | null } | null;
  };
  type RecentMaterial = {
    material_id: string;
    assigned_at: string;
    materiais: {
      id: string;
      title: string;
      subject: string | null;
      grade_level: string | null;
      file_url: string | null;
    } | null;
  };

  const allEntregas = (entregasResult.data ?? []) as EntregaStats[];
  const upcomingEntregas = (upcomingResult.data ?? []) as UpcomingEntrega[];
  const recentMateriais = (materiaisResult.data ?? []) as RecentMaterial[];

  // Stat counts
  const stats = {
    pendentes: allEntregas.filter(
      (e) =>
        (e.status === "pendente" || e.status === "em_andamento") &&
        !(
          e.tarefas?.due_date &&
          new Date(`${e.tarefas.due_date}T23:59:59`).getTime() < Date.now()
        ),
    ).length,
    atrasadas: allEntregas.filter(
      (e) =>
        (e.status === "pendente" || e.status === "em_andamento") &&
        e.tarefas?.due_date &&
        new Date(`${e.tarefas.due_date}T23:59:59`).getTime() < Date.now(),
    ).length,
    entregues: allEntregas.filter((e) => e.status === "entregue").length,
    revisadas: allEntregas.filter((e) => e.status === "revisado").length,
  };

  // Resolve download URLs for recent materials
  const materiaisWithUrls = await Promise.all(
    recentMateriais.map(async (am) => ({
      ...am,
      materiais: am.materiais
        ? {
            ...am.materiais,
            download_url: await getMaterialDownloadUrl(am.materiais.file_url),
          }
        : null,
    })),
  );

  const firstName = session.profile.full_name?.split(" ")[0] ?? "Aluno";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {firstName}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aqui está um resumo do seu progresso.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tarefas pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.pendentes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-bold ${stats.atrasadas > 0 ? "text-destructive" : ""}`}
            >
              {stats.atrasadas}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entregas enviadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.entregues}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revisadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.revisadas}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Próximas tarefas
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.ALUNO.TAREFAS}>Ver todas</Link>
          </Button>
        </div>

        {upcomingEntregas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma tarefa pendente. Bom trabalho!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEntregas.map((entrega) => {
              const statusMeta = getStatusMeta(
                entrega.status,
                entrega.tarefas?.due_date,
              );
              const daysUntil = getDaysUntil(entrega.tarefas?.due_date);
              const StatusIcon = statusMeta.icon;

              return (
                <div
                  key={entrega.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entrega.tarefas?.title ?? "Tarefa"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entrega.tarefas?.due_date)}
                        {daysUntil !== null && daysUntil >= 0 && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">
                            ·{" "}
                            {daysUntil === 0
                              ? "Vence hoje"
                              : `${daysUntil}d restantes`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusMeta.variant} className="shrink-0">
                    {statusMeta.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent materials */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Materiais recentes
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.ALUNO.MATERIAIS}>Ver todos</Link>
          </Button>
        </div>

        {materiaisWithUrls.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum material disponível ainda.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {materiaisWithUrls.map((am) => (
              <div
                key={am.material_id}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-snug">
                    {am.materiais?.title ?? "Material"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {am.materiais?.subject && (
                    <Badge variant="secondary" className="text-xs">
                      {am.materiais.subject}
                    </Badge>
                  )}
                  {am.materiais?.grade_level && (
                    <Badge variant="outline" className="text-xs">
                      {am.materiais.grade_level}
                    </Badge>
                  )}
                </div>
                {am.materiais?.download_url && (
                  <a
                    href={am.materiais.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs mt-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
