"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, MailCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { deleteProfessor } from "@/lib/actions/professores";
import { ProfessorForm } from "./professor-form";
import type { Database } from "@repo/db";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function ProfessoresClient({
  professores,
}: {
  professores: ProfileRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProfileRow | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);

    const result = await deleteProfessor(deleteTarget.id);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {professores.length} professor{professores.length !== 1 ? "es" : ""}{" "}
          cadastrado{professores.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar professor
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-15" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {professores.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-muted-foreground"
                >
                  Nenhum professor cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              professores.map((professor) => (
                <TableRow key={professor.id}>
                  <TableCell className="font-medium">
                    {professor.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {professor.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    {professor.clerk_user_id ? (
                      <Badge
                        variant="secondary"
                        className="gap-1 text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950"
                      >
                        <MailCheck className="h-3 w-3" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Convite pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={deletingId === professor.id}
                      onClick={() => setDeleteTarget(professor)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            <DialogTitle>Adicionar professor</DialogTitle>
          </DialogHeader>
          <ProfessorForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover professor?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta de{" "}
              <strong>{deleteTarget?.full_name ?? deleteTarget?.email}</strong>{" "}
              será removida da plataforma. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
