"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RegistroForm } from "./registro-form";
import {
  deleteRegistroFinanceiro,
  marcarComoPago,
} from "@/lib/actions/financeiro";
import type { Database } from "@repo/db";

type Registro = Database["public"]["Tables"]["financeiro"]["Row"] & {
  alunos: {
    grade: string | null;
    profiles: { full_name: string | null } | null;
  } | null;
};

type AlunoResumo = Pick<
  Database["public"]["Tables"]["alunos"]["Row"],
  "id" | "monthly_amount"
> & {
  profiles: { full_name: string | null } | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

export function FinanceiroClient({
  registros,
  alunos,
}: {
  registros: Registro[];
  alunos: AlunoResumo[];
}) {
  const router = useRouter();
  const [registroOpen, setRegistroOpen] = useState(false);
  const [markingPagoId, setMarkingPagoId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Registro | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Registro | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleMarcarPago(id: string) {
    setMarkingPagoId(id);
    const result = await marcarComoPago(id);
    setMarkingPagoId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  async function handleDelete(registro: Registro) {
    setIsDeleting(true);
    const result = await deleteRegistroFinanceiro(registro.id);
    setIsDeleting(false);
    setDeleteTarget(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }
  const alunosComMensalidade = alunos.filter((a) => a.monthly_amount != null);
  const alunosSemMensalidade = alunos.filter((a) => a.monthly_amount == null);
  const expectedMonthly = alunos.reduce(
    (acc, a) => acc + (a.monthly_amount ?? 0),
    0,
  );
  const pagos = registros.filter((r) => r.paid_at);
  const pendentes = registros.filter((r) => !r.paid_at);
  const totalPago = pagos.reduce((acc, r) => acc + r.amount, 0);
  const totalPendente = pendentes.reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Esperada no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(expectedMonthly)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {alunosComMensalidade.length} aluno
              {alunosComMensalidade.length !== 1 ? "s" : ""} com mensalidade
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalPago)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pagos.length} registros
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totalPendente)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendentes.length} registros
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos Sem Mensalidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {alunosSemMensalidade.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Eles não entram na projeção até receberem uma mensalidade
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Lançamentos</h2>
            <p className="text-sm text-muted-foreground">
              Histórico dos pagamentos registrados manualmente.
            </p>
          </div>
          <Button size="sm" onClick={() => setRegistroOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Nenhum registro financeiro.
                  </TableCell>
                </TableRow>
              ) : (
                registros.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.alunos?.profiles?.full_name ?? "—"}
                    </TableCell>
                    <TableCell>{formatCurrency(r.amount)}</TableCell>
                    <TableCell>{formatDate(r.due_date)}</TableCell>
                    <TableCell>
                      {r.paid_at ? formatDate(r.paid_at.split("T")[0]) : "—"}
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
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!r.paid_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={markingPagoId === r.id}
                            onClick={() => void handleMarcarPago(r.id)}
                          >
                            {markingPagoId === r.id
                              ? "Salvando..."
                              : "Marcar como pago"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditTarget(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={registroOpen} onOpenChange={setRegistroOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
            </DialogHeader>
            <RegistroForm
              alunos={alunos}
              onSuccess={() => setRegistroOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!editTarget}
          onOpenChange={(v) => !v && setEditTarget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Lançamento</DialogTitle>
            </DialogHeader>
            {editTarget && (
              <RegistroForm
                alunos={alunos}
                registro={editTarget}
                onSuccess={() => setEditTarget(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(v) => !v && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O registro de{" "}
                <span className="font-medium">
                  {deleteTarget?.alunos?.profiles?.full_name ?? "aluno"}
                </span>{" "}
                será removido permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
                onClick={() => deleteTarget && void handleDelete(deleteTarget)}
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
