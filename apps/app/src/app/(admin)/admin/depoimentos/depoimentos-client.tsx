"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Quote } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { DepoimentoForm } from "./depoimento-form";
import { deleteDepoimento } from "@/lib/actions/depoimentos";
import type { Database } from "@repo/db";

type Depoimento = Database["public"]["Tables"]["depoimentos"]["Row"];

const MAX_DEPOIMENTOS = 3;

export function DepoimentosClient({
  depoimentos,
}: {
  depoimentos: Depoimento[];
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Depoimento | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Depoimento | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteDepoimento(deleteTarget.id);
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      router.refresh();
    }
    setDeleteTarget(null);
  }

  const atLimit = depoimentos.length >= MAX_DEPOIMENTOS;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {depoimentos.length}/{MAX_DEPOIMENTOS} depoimentos cadastrados
        </p>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          disabled={atLimit}
          title={
            atLimit ? `Máximo de ${MAX_DEPOIMENTOS} depoimentos` : undefined
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          Novo Depoimento
        </Button>
      </div>

      {depoimentos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhum depoimento cadastrado. Crie o primeiro.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {depoimentos.map((dep) => (
            <Card key={dep.id}>
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <Quote className="h-5 w-5 text-primary/40 shrink-0 mt-0.5" />
                  <div className="flex gap-1 shrink-0">
                    {!dep.active && (
                      <Badge variant="secondary" className="text-xs">
                        Oculto
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground italic line-clamp-4">
                  &ldquo;{dep.quote}&rdquo;
                </p>

                <p className="text-sm font-semibold">{dep.author}</p>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditTarget(dep)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(dep)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Depoimento</DialogTitle>
          </DialogHeader>
          <DepoimentoForm onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Depoimento</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <DepoimentoForm
              depoimento={editTarget}
              onSuccess={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover depoimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O depoimento será removido do
              site imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
