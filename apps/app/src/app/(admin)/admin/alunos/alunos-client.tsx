"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  MailCheck,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Ban,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteAluno,
  resendAlunoInvite,
  toggleAlunoStatus,
} from "@/lib/actions/alunos";
import { AlunoForm } from "./aluno-form";
import type { Database } from "@repo/db";
type AlunoRow = Database["public"]["Tables"]["alunos"]["Row"] & {
  profiles: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "full_name" | "avatar_url" | "clerk_user_id" | "banned"
  > | null;
};

type ProfessorOption = {
  id: string;
  full_name: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function AlunosClient({
  alunos,
  isAdmin,
  professors,
}: {
  alunos: AlunoRow[];
  isAdmin: boolean;
  professors: ProfessorOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AlunoRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AlunoRow | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<AlunoRow | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  function handleAdd() {
    setEditing(null);
    setOpen(true);
  }

  function handleEdit(aluno: AlunoRow) {
    setEditing(aluno);
    setOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);

    const result = await deleteAluno(deleteTarget.id);

    setDeletingId(null);
    setDeleteTarget(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  async function handleToggleStatus() {
    if (!statusTarget) return;
    setUpdatingStatusId(statusTarget.id);

    const isBanned = !!statusTarget.profiles?.banned;
    const result = await toggleAlunoStatus(statusTarget.id, !isBanned);

    setUpdatingStatusId(null);
    setStatusTarget(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  async function handleResendInvite(aluno: AlunoRow) {
    setResendingId(aluno.id);
    const result = await resendAlunoInvite(aluno.id);
    setResendingId(null);
    if (!result.ok) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {alunos.length} aluno{alunos.length !== 1 ? "s" : ""} cadastrado
          {alunos.length !== 1 ? "s" : ""}
        </p>
        {isAdmin && (
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Aluno
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              {isAdmin && <TableHead>Mensalidade</TableHead>}
              <TableHead>Conta</TableHead>
              <TableHead>Série</TableHead>
              <TableHead>Disciplinas</TableHead>
              <TableHead>Professor</TableHead>
              <TableHead className="w-15" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 7 : 6}
                  className="h-32 text-center text-muted-foreground"
                >
                  {isAdmin
                    ? "Nenhum aluno cadastrado."
                    : "Nenhum aluno atribuído a você ainda."}
                </TableCell>
              </TableRow>
            ) : (
              alunos.map((aluno) => {
                const isAtivo = !!aluno.profiles?.clerk_user_id;
                const semProfessor = !aluno.professor_id;

                return (
                  <TableRow
                    key={aluno.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      semProfessor &&
                        (isAtivo ? "animate-error-row" : "animate-warning-row"),
                    )}
                    onClick={() => router.push(`/admin/alunos/${aluno.id}`)}
                  >
                    <TableCell className="font-medium">
                      {aluno.profiles?.full_name ?? aluno.contact_email ?? "—"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {aluno.monthly_amount != null ? (
                          formatCurrency(aluno.monthly_amount)
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {aluno.contact_email ?? "Sem email cadastrado"}
                        </div>
                        {aluno.profiles?.banned ? (
                          <Badge variant="destructive">Desativado</Badge>
                        ) : aluno.profiles?.clerk_user_id ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : aluno.profile_id ? (
                          <Badge variant="secondary" className="gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
                            Convite pendente
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sem conta</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{aluno.grade ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {aluno.subject_focus?.length ? (
                          aluno.subject_focus.map((s) => (
                            <Badge
                              key={s}
                              variant="secondary"
                              className="text-xs"
                            >
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {aluno.professor_id ? (
                        (professors.find((p) => p.id === aluno.professor_id)
                          ?.full_name ?? "—")
                      ) : isAtivo ? (
                        <Badge
                          variant="outline"
                          className="animate-pulse gap-1.5 border-destructive bg-destructive/10 text-destructive font-medium hover:bg-destructive/20"
                        >
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                          </span>
                          Atrelar professor
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="animate-pulse gap-1.5 border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-500/20"
                        >
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          Atrelar professor
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/alunos/${aluno.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => handleEdit(aluno)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {aluno.profile_id &&
                            !aluno.profiles?.clerk_user_id && (
                              <DropdownMenuItem
                                disabled={resendingId === aluno.id}
                                onClick={() => void handleResendInvite(aluno)}
                              >
                                <MailCheck className="h-4 w-4 mr-2" />
                                {resendingId === aluno.id
                                  ? "Reenviando..."
                                  : "Reenviar convite"}
                              </DropdownMenuItem>
                            )}
                          {aluno.profile_id && (
                            <DropdownMenuItem
                              className={cn(
                                aluno.profiles?.banned
                                  ? "text-emerald-600 focus:text-emerald-600 dark:text-emerald-400 dark:focus:text-emerald-400"
                                  : "text-amber-600 focus:text-amber-600 dark:text-amber-400 dark:focus:text-amber-400",
                              )}
                              disabled={updatingStatusId === aluno.id}
                              onClick={() => setStatusTarget(aluno)}
                            >
                              {aluno.profiles?.banned ? (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Ativar conta
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Desativar conta
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={deletingId === aluno.id}
                              onClick={() => setDeleteTarget(aluno)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {deletingId === aluno.id
                                ? "Excluindo..."
                                : "Excluir"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-lg flex flex-col p-0 gap-0 max-sm:fixed max-sm:inset-0 max-sm:w-screen max-sm:h-screen max-sm:max-w-none max-sm:max-h-none max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:top-0 max-sm:left-0">
          <DialogHeader className="p-6 pb-4 border-b text-left shrink-0 max-sm:pt-[calc(1.25rem+env(safe-area-inset-top))]">
            <DialogTitle>{editing ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
          </DialogHeader>
          <AlunoForm
            aluno={editing}
            professors={professors}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.profile_id
                ? "Excluir este aluno também apagará a conta de acesso vinculada. Esta ação não pode ser desfeita."
                : "Deseja excluir este aluno? Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={!!deletingId}
              variant="destructive"
            >
              {deletingId ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!statusTarget}
        onOpenChange={(o) => !o && setStatusTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusTarget?.profiles?.banned
                ? "Reativar conta do aluno?"
                : "Desativar conta do aluno?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.profiles?.banned
                ? "Deseja reativar o acesso deste aluno à plataforma? Ele poderá fazer login normalmente."
                : "Desativar este aluno impedirá que ele faça login na plataforma e revogará todas as sessões ativas imediatamente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleToggleStatus()}
              disabled={!!updatingStatusId}
              variant={
                statusTarget?.profiles?.banned ? "default" : "destructive"
              }
            >
              {updatingStatusId
                ? "Atualizando..."
                : statusTarget?.profiles?.banned
                  ? "Reativar"
                  : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
