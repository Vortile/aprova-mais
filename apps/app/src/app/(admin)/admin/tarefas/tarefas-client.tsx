"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  Info,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { Database } from "@repo/db";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { deleteTarefa } from "@/lib/actions/tarefas";
import { ReviewEntregaForm } from "./review-entrega-form";
import { TarefaEditForm } from "./tarefa-edit-form";
import { TarefaForm } from "./tarefa-form";

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

type ReviewTarget = {
  tarefaTitle: string;
  alunoName: string;
  entrega: EntregaRow;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

function formatDate(value: string | null) {
  if (!value) {
    return "Sem prazo";
  }

  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

function getStatusMeta(status: EntregaRow["status"], dueDate: string | null) {
  const isLate =
    Boolean(dueDate) &&
    ["pendente", "em_andamento"].includes(status) &&
    new Date(`${dueDate}T23:59:59`).getTime() < Date.now();

  if (isLate) {
    return { label: "Atrasada", variant: "destructive" as const };
  }

  if (status === "revisado") {
    return { label: "Revisada", variant: "default" as const };
  }

  if (status === "entregue") {
    return { label: "Entregue", variant: "secondary" as const };
  }

  if (status === "em_andamento") {
    return { label: "Em andamento", variant: "outline" as const };
  }

  return { label: "Pendente", variant: "outline" as const };
}

export function TarefasClient({
  tarefas,
  alunos,
  materiais,
  isAdmin = false,
}: {
  tarefas: TarefaRow[];
  alunos: AlunoOption[];
  materiais: MaterialRow[];
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TarefaRow | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  const stats = useMemo(() => {
    const entregas = tarefas.flatMap((tarefa) => tarefa.tarefa_alunos ?? []);

    return {
      tarefas: tarefas.length,
      pendentes: entregas.filter(
        (entrega) =>
          entrega.status === "pendente" || entrega.status === "em_andamento",
      ).length,
      entregues: entregas.filter((entrega) => entrega.status === "entregue")
        .length,
      revisadas: entregas.filter((entrega) => entrega.status === "revisado")
        .length,
    };
  }, [tarefas]);

  async function handleDelete(tarefaId: string) {
    const result = await deleteTarefa(tarefaId);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
  }

  return (
    <>
      {isAdmin && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-900">
              Visualização de Administrador
            </p>
            <p className="text-blue-700 leading-relaxed">
              Como administrador, você pode visualizar e gerenciar as tarefas
              criadas por todos os professores, bem como acompanhar as entregas
              dos alunos. No entanto, você não pode criar tarefas, pois
              administradores não possuem alunos diretamente vinculados.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tarefas ativas" value={stats.tarefas} />
        <StatCard label="Entregas pendentes" value={stats.pendentes} />
        <StatCard label="Aguardando revisão" value={stats.entregues} />
        <StatCard label="Revisadas" value={stats.revisadas} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {tarefas.length} tarefa{tarefas.length !== 1 ? "s" : ""} cadastrada
          {tarefas.length !== 1 ? "s" : ""}
        </p>
        {isAdmin ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    size="sm"
                    disabled
                    className="cursor-not-allowed opacity-50"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Nova tarefa
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                Administradores não possuem alunos diretamente, portanto não
                podem criar tarefas.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Nova tarefa
          </Button>
        )}
      </div>

      {tarefas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhuma tarefa criada ainda.
          </p>
          {isAdmin ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="cursor-not-allowed opacity-50"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Criar primeira tarefa
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Administradores não possuem alunos diretamente, portanto não
                  podem criar tarefas.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Criar primeira tarefa
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tarefas.map((tarefa) => {
            const entregas = tarefa.tarefa_alunos ?? [];
            const entregues = entregas.filter((entrega) =>
              ["entregue", "revisado"].includes(entrega.status),
            ).length;

            return (
              <Card key={tarefa.id}>
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{tarefa.title}</CardTitle>
                        <Badge variant="outline">
                          {formatDate(tarefa.due_date)}
                        </Badge>
                        {tarefa.materiais?.title ? (
                          <Badge variant="secondary">
                            {tarefa.materiais.title}
                          </Badge>
                        ) : null}
                        {tarefa.materiais?.download_url ? (
                          <a
                            href={tarefa.materiais.download_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <Download className="mr-1 h-4 w-4" />
                              Abrir material
                            </Button>
                          </a>
                        ) : null}
                      </div>
                      {tarefa.description ? (
                        <CardDescription className="max-w-3xl whitespace-pre-wrap leading-6">
                          {tarefa.description}
                        </CardDescription>
                      ) : (
                        <CardDescription>
                          Sem orientações adicionais.
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditTarget(tarefa)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => void handleDelete(tarefa.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoPill label="Alunos" value={`${entregas.length}`} />
                    <InfoPill
                      label="Entregas recebidas"
                      value={`${entregues}`}
                    />
                    <InfoPill
                      label="Criada em"
                      value={dateFormatter.format(new Date(tarefa.created_at))}
                    />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Entrega</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entregas.map((entrega) => {
                        const alunoName =
                          entrega.alunos?.profiles?.full_name ??
                          entrega.alunos?.contact_email ??
                          "Aluno";
                        const statusMeta = getStatusMeta(
                          entrega.status,
                          tarefa.due_date,
                        );

                        return (
                          <TableRow key={entrega.id}>
                            <TableCell className="font-medium">
                              {alunoName}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusMeta.variant}>
                                {statusMeta.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {entrega.submitted_at
                                ? formatDate(entrega.submitted_at.slice(0, 10))
                                : "Ainda não enviada"}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {entrega.teacher_feedback || "Sem feedback"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setReviewTarget({
                                    tarefaTitle: tarefa.title,
                                    alunoName,
                                    entrega,
                                  })
                                }
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Revisar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription>
              Defina o conteúdo, o prazo e quem precisa entregar.
            </DialogDescription>
          </DialogHeader>
          <TarefaForm
            alunos={alunos}
            materiais={materiais}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(reviewTarget)}
        onOpenChange={(nextOpen) => !nextOpen && setReviewTarget(null)}
      >
        <DialogContent className="max-w-2xl">
          {reviewTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Revisar entrega</DialogTitle>
                <DialogDescription>
                  {reviewTarget.alunoName} · {reviewTarget.tarefaTitle}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 rounded-lg border bg-muted/20 p-4 text-sm">
                <div>
                  <p className="font-medium text-slate-800">
                    Resposta do aluno
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {reviewTarget.entrega.student_notes ||
                      "Nenhuma observação enviada."}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    Fotos/Arquivos enviados pelo aluno
                  </p>
                  {(() => {
                    const url = reviewTarget.entrega.submission_url;
                    if (!url) {
                      return (
                        <p className="mt-1 text-muted-foreground">
                          Nenhum arquivo enviado.
                        </p>
                      );
                    }

                    let filePaths: string[] = [];
                    try {
                      if (url.startsWith("[")) {
                        filePaths = JSON.parse(url) as string[];
                      } else {
                        filePaths = url
                          .split(",")
                          .map((f) => f.trim())
                          .filter(Boolean);
                      }
                    } catch {
                      filePaths = [url];
                    }

                    return (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filePaths.map((path, idx) => {
                          const isImage = /\.(jpe?g|png|gif|webp)$/i.test(path);
                          const fileName = path.split("/").pop() || "arquivo";
                          // Construct a clean, accessible link using the material-download pattern or direct if needed
                          // For simplicity, we can fetch/show materials directly or render them
                          const directUrl = `/api/material-upload?path=${encodeURIComponent(path)}`; // actually getMaterialDownloadUrl can be called if we are in server-component, but here in client we can use a router handler or a button, wait, materials download can use a signed URL or we can provide a small helper or a direct link since the bucket 'aprova+' handles downloads.
                          // Wait, since we are in client, can we create an endpoint to download? Or just open them?
                          // Let's redirect to a download API route or we can provide a small server action or API route.
                          // Let's check how materials-download handles it. It creates a signed URL.
                          // Let's create an API route under `/api/submission-download?path=...` or similar. Let's create this API route to sign and redirect!
                          const downloadUrl = `/api/submission-download?path=${encodeURIComponent(path)}`;

                          return (
                            <a
                              key={idx}
                              href={downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 p-2 rounded-lg border bg-white hover:bg-slate-50 transition-colors shadow-xs"
                            >
                              {isImage ? (
                                <span className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                  📸
                                </span>
                              ) : (
                                <span className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  📄
                                </span>
                              )}
                              <span className="text-xs truncate font-medium text-slate-700 flex-1">
                                {fileName.length > 25
                                  ? `${fileName.slice(0, 22)}...`
                                  : fileName}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <ReviewEntregaForm
                entregaId={reviewTarget.entrega.id}
                initialFeedback={reviewTarget.entrega.teacher_feedback}
                onSuccess={() => setReviewTarget(null)}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar tarefa</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <TarefaEditForm
              tarefa={editTarget}
              materiais={materiais}
              alunos={alunos}
              currentAlunoIds={
                editTarget.tarefa_alunos
                  ?.map((e) => e.alunos?.id ?? "")
                  .filter(Boolean) ?? []
              }
              onSuccess={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
