"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
import { deleteAluno } from "@/lib/actions/alunos";
import { AlunoForm } from "./aluno-form";
import type { Database } from "@repo/db";
type AlunoRow = Database["public"]["Tables"]["alunos"]["Row"] & {
  profiles: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "full_name" | "avatar_url" | "clerk_user_id"
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
              <TableHead>Mensalidade</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Série</TableHead>
              <TableHead>Disciplinas</TableHead>
              <TableHead className="w-15" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  Nenhum aluno cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              alunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell className="font-medium">
                    {aluno.profiles?.full_name ?? aluno.contact_email ?? "—"}
                  </TableCell>
                  <TableCell>
                    {aluno.monthly_amount != null ? (
                      formatCurrency(aluno.monthly_amount)
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {aluno.contact_email ?? "Sem email cadastrado"}
                      </div>
                      {aluno.profiles?.clerk_user_id ? (
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
                    {isAdmin ? (
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
                          <DropdownMenuItem onClick={() => handleEdit(aluno)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
