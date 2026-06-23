"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  PlayCircle,
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
import { markTarefaInProgress } from "@/lib/actions/tarefas";
import { TarefaEntregaForm } from "./tarefa-entrega-form";

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

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

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

function formatDate(value: string | null) {
  if (!value) {
    return "Sem prazo";
  }

  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

export function AlunoTarefasClient({ entregas }: { entregas: EntregaRow[] }) {
  const [selectedEntrega, setSelectedEntrega] = useState<EntregaRow | null>(
    null,
  );

  const stats = useMemo(
    () => ({
      total: entregas.length,
      pendentes: entregas.filter((entrega) =>
        ["pendente", "em_andamento"].includes(entrega.status),
      ).length,
      entregues: entregas.filter((entrega) => entrega.status === "entregue")
        .length,
      revisadas: entregas.filter((entrega) => entrega.status === "revisado")
        .length,
    }),
    [entregas],
  );

  async function handleStart(entregaId: string) {
    const result = await markTarefaInProgress({ entregaId });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tarefas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Veja o que está pendente, envie suas respostas e acompanhe o
            feedback do professor.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Pendentes" value={stats.pendentes} />
          <StatCard label="Entregues" value={stats.entregues} />
          <StatCard label="Revisadas" value={stats.revisadas} />
        </div>

        {entregas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma tarefa disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {entregas.map((entrega) => {
              const tarefa = entrega.tarefas;

              if (!tarefa) {
                return null;
              }

              const statusMeta = getStatusMeta(entrega.status, tarefa.due_date);

              return (
                <Card key={entrega.id}>
                  <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle>{tarefa.title}</CardTitle>
                          <Badge variant={statusMeta.variant}>
                            {statusMeta.label}
                          </Badge>
                          {tarefa.materiais?.title ? (
                            <Badge variant="secondary">
                              {tarefa.materiais.title}
                            </Badge>
                          ) : null}
                        </div>
                        <CardDescription>
                          Prazo: {formatDate(tarefa.due_date)}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
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
                        {entrega.status === "pendente" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleStart(entrega.id)}
                          >
                            <PlayCircle className="mr-1 h-4 w-4" />
                            Iniciar
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          onClick={() => setSelectedEntrega(entrega)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          {entrega.submitted_at
                            ? "Atualizar entrega"
                            : "Enviar tarefa"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {tarefa.description || "Sem instruções adicionais."}
                    </p>
                    {entrega.student_notes ? (
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm font-medium">Sua resposta</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                          {entrega.student_notes}
                        </p>
                      </div>
                    ) : null}
                    {entrega.submission_url ? (
                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-slate-800">Arquivos enviados</p>
                        {(() => {
                          const url = entrega.submission_url;
                          let filePaths: string[] = [];
                          try {
                            if (url.startsWith("[")) {
                              filePaths = JSON.parse(url) as string[];
                            } else {
                              filePaths = url.split(",").map(f => f.trim()).filter(Boolean);
                            }
                          } catch {
                            filePaths = [url];
                          }

                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                              {filePaths.map((path, idx) => {
                                const isImage = /\.(jpe?g|png|gif|webp)$/i.test(path);
                                const fileName = path.split("/").pop() || "arquivo";
                                const downloadUrl = isImage || path.startsWith("entregas/")
                                  ? `/api/submission-download?path=${encodeURIComponent(path)}`
                                  : path;

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
                                      {fileName.length > 25 ? `${fileName.slice(0, 22)}...` : fileName}
                                    </span>
                                  </a>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}
                    {entrega.teacher_feedback ? (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <p className="text-sm font-medium">
                          Feedback do professor
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                          {entrega.teacher_feedback}
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(selectedEntrega)}
        onOpenChange={(nextOpen) => !nextOpen && setSelectedEntrega(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedEntrega?.tarefas ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEntrega.tarefas.title}</DialogTitle>
                <DialogDescription>
                  Envie o link da atividade e um resumo do que foi feito.
                </DialogDescription>
              </DialogHeader>
              <TarefaEntregaForm
                entregaId={selectedEntrega.id}
                initialNotes={selectedEntrega.student_notes}
                initialUrl={selectedEntrega.submission_url}
                onSuccess={() => setSelectedEntrega(null)}
              />
            </>
          ) : null}
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
