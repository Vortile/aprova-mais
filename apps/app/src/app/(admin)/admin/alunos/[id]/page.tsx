import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  DollarSign,
  Mail,
  MapPin,
  StickyNote,
  User,
} from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { TABLES, type Database } from "@repo/db";
import { ROLES } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";
import { getMaterialDownloadUrl } from "@/lib/materials";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Detalhes do Aluno | Admin" };

type AlunoRow = Database["public"]["Tables"]["alunos"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type FinanceiroRow = Database["public"]["Tables"]["financeiro"]["Row"];

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return dateFormatter.format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getStatusMeta(
  status: string,
  dueDate: string | null | undefined,
): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
} {
  const isLate =
    Boolean(dueDate) &&
    ["pendente", "em_andamento"].includes(status) &&
    new Date(`${dueDate}T23:59:59`).getTime() < Date.now();

  if (isLate) return { label: "Atrasada", variant: "destructive" };
  if (status === "revisado") return { label: "Revisada", variant: "default" };
  if (status === "entregue") return { label: "Entregue", variant: "secondary" };
  if (status === "em_andamento")
    return { label: "Em andamento", variant: "outline" };
  return { label: "Pendente", variant: "outline" };
}

export default async function AlunoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireStaff();
  const supabase = createAdminClient();
  const isAdmin = session.profile.role === ROLES.ADMIN;

  // Fetch aluno with profile and professor
  const { data: alunoData } = await supabase
    .from(TABLES.ALUNOS)
    .select(
      "*, profiles!alunos_profile_id_fkey(id, full_name, email, clerk_user_id, role, avatar_url, address, created_at)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!alunoData) {
    notFound();
  }

  const aluno = alunoData as AlunoRow & { profiles: ProfileRow | null };

  // Professors can only see their own students
  if (!isAdmin && aluno.professor_id !== session.profile.id) {
    notFound();
  }

  // Fetch professor name if assigned
  let professorName: string | null = null;
  if (aluno.professor_id) {
    const { data: profData } = await supabase
      .from(TABLES.PROFILES)
      .select("full_name")
      .eq("id", aluno.professor_id)
      .maybeSingle();
    professorName =
      (profData as { full_name: string | null } | null)?.full_name ?? null;
  }

  // Parallel data fetching
  const [tarefaAlunosResult, alunoMateriaisResult, financeiroResult] =
    await Promise.all([
      supabase
        .from(TABLES.TAREFA_ALUNOS)
        .select(
          "id, status, submitted_at, reviewed_at, teacher_feedback, tarefas(id, title, due_date)",
        )
        .eq("aluno_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from(TABLES.ALUNO_MATERIAIS)
        .select(
          "material_id, assigned_at, materiais(id, title, subject, grade_level, file_url)",
        )
        .eq("aluno_id", id)
        .order("assigned_at", { ascending: false }),
      isAdmin
        ? supabase
            .from(TABLES.FINANCEIRO)
            .select("*")
            .eq("aluno_id", id)
            .order("due_date", { ascending: false })
        : Promise.resolve({ data: null }),
    ]);

  type TarefaEntrega = {
    id: string;
    status: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    teacher_feedback: string | null;
    tarefas: { id: string; title: string; due_date: string | null } | null;
  };

  type AlunoMaterial = {
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

  const entregas = (tarefaAlunosResult.data ?? []) as TarefaEntrega[];
  const alunoMateriais = (alunoMateriaisResult.data ?? []) as AlunoMaterial[];
  const financeiroRegistros = (financeiroResult.data ?? []) as FinanceiroRow[];

  // Resolve material download URLs
  const materiaisWithUrls = await Promise.all(
    alunoMateriais.map(async (am) => ({
      ...am,
      materiais: am.materiais
        ? {
            ...am.materiais,
            download_url: await getMaterialDownloadUrl(am.materiais.file_url),
          }
        : null,
    })),
  );

  const name = aluno.profiles?.full_name ?? aluno.contact_email ?? "Aluno";
  const accountStatus = aluno.profiles?.clerk_user_id
    ? "ativo"
    : aluno.profile_id
      ? "pendente"
      : "sem-conta";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="-ml-1 shrink-0"
          >
            <Link href={ROUTES.ADMIN.ALUNOS}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {aluno.grade ?? "Série não informada"}
              {aluno.subject_focus?.length
                ? ` · ${aluno.subject_focus.join(", ")}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {accountStatus === "ativo" && <Badge variant="default">Ativo</Badge>}
          {accountStatus === "pendente" && (
            <Badge variant="secondary" className="gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
              Convite pendente
            </Badge>
          )}
          {accountStatus === "sem-conta" && (
            <Badge variant="outline">Sem conta</Badge>
          )}
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informações do aluno</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          {aluno.contact_email && (
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p>{aluno.contact_email}</p>
              </div>
            </div>
          )}
          {aluno.monthly_amount != null && (
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Mensalidade</p>
                <p>{formatCurrency(aluno.monthly_amount)}</p>
              </div>
            </div>
          )}
          {professorName && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Professor</p>
                <p>{professorName}</p>
              </div>
            </div>
          )}
          {aluno.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Endereço</p>
                <p>{aluno.address}</p>
              </div>
            </div>
          )}
          {aluno.notes && (
            <div className="flex items-start gap-2 sm:col-span-2 lg:col-span-3">
              <StickyNote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Observações</p>
                <p className="whitespace-pre-wrap">{aluno.notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarefas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">
              Tarefas
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({entregas.length})
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {entregas.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Nenhuma tarefa atribuída.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entregas.map((entrega) => {
                  const statusMeta = getStatusMeta(
                    entrega.status,
                    entrega.tarefas?.due_date,
                  );
                  return (
                    <TableRow key={entrega.id}>
                      <TableCell className="font-medium">
                        {entrega.tarefas?.title ?? "—"}
                      </TableCell>
                      <TableCell>
                        {formatDate(entrega.tarefas?.due_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMeta.variant}>
                          {statusMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entrega.submitted_at
                          ? formatDate(entrega.submitted_at.slice(0, 10))
                          : "Não enviada"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {entrega.teacher_feedback || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Materiais */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">
              Materiais
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({materiaisWithUrls.length})
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {materiaisWithUrls.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Nenhum material atribuído.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Atribuído em</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiaisWithUrls.map((am) => (
                  <TableRow key={am.material_id}>
                    <TableCell className="font-medium">
                      {am.materiais?.title ?? "—"}
                    </TableCell>
                    <TableCell>
                      {am.materiais?.subject ? (
                        <Badge variant="secondary" className="text-xs">
                          {am.materiais.subject}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {am.materiais?.grade_level ? (
                        <Badge variant="outline" className="text-xs">
                          {am.materiais.grade_level}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{formatDate(am.assigned_at)}</TableCell>
                    <TableCell>
                      {am.materiais?.download_url && (
                        <a
                          href={am.materiais.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            Baixar
                          </Button>
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Financeiro — admin only */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">
                Financeiro
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({financeiroRegistros.length})
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {financeiroRegistros.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                Nenhum lançamento financeiro.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financeiroRegistros.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {formatCurrency(r.amount)}
                      </TableCell>
                      <TableCell>{formatDate(r.due_date)}</TableCell>
                      <TableCell>
                        {r.paid_at ? formatDate(r.paid_at.slice(0, 10)) : "—"}
                      </TableCell>
                      <TableCell>
                        {r.paid_at ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          >
                            Pago
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          >
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {r.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
