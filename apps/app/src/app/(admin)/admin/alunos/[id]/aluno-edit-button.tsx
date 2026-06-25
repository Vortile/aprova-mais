"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  MailCheck,
  Pencil,
  Settings,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AlunoForm } from "../aluno-form";
import {
  deleteAluno,
  resendAlunoInvite,
  toggleAlunoStatus,
} from "@/lib/actions/alunos";
import { ROUTES } from "@/lib/routes";
import type { Database } from "@repo/db";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AlunoRow = Database["public"]["Tables"]["alunos"]["Row"] & {
  profiles: Pick<
    ProfileRow,
    "id" | "clerk_user_id" | "email" | "full_name" | "role" | "banned"
  > | null;
};

type ProfessorOption = {
  id: string;
  full_name: string | null;
};

export function AlunoEditButton({
  aluno,
  professors,
}: {
  aluno: AlunoRow;
  professors: ProfessorOption[];
}) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteAluno(aluno.id);
    setIsDeleting(false);
    setOpenDelete(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    router.push(ROUTES.ADMIN.ALUNOS);
  }

  async function handleResendInvite() {
    setIsResending(true);
    const result = await resendAlunoInvite(aluno.id);
    setIsResending(false);

    if (!result.ok) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
    }
  }

  async function handleToggleStatus() {
    setIsUpdatingStatus(true);
    const isBanned = !!aluno.profiles?.banned;
    const result = await toggleAlunoStatus(aluno.id, !isBanned);
    setIsUpdatingStatus(false);
    setOpenStatus(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  const isBanned = !!aluno.profiles?.banned;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Settings className="h-4 w-4" />
            Ações
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar Aluno
          </DropdownMenuItem>

          {aluno.profile_id && !aluno.profiles?.clerk_user_id && (
            <DropdownMenuItem
              disabled={isResending}
              onClick={() => void handleResendInvite()}
            >
              <MailCheck className="h-4 w-4 mr-2" />
              {isResending ? "Reenviando..." : "Reenviar convite"}
            </DropdownMenuItem>
          )}

          {aluno.profile_id && (
            <DropdownMenuItem
              className={cn(
                isBanned
                  ? "text-emerald-600 focus:text-emerald-600 dark:text-emerald-400 dark:focus:text-emerald-400"
                  : "text-amber-600 focus:text-amber-600 dark:text-amber-400 dark:focus:text-amber-400",
              )}
              disabled={isUpdatingStatus}
              onClick={() => setOpenStatus(true)}
            >
              {isBanned ? (
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

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={isDeleting}
            onClick={() => setOpenDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Aluno
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-h-[90vh] sm:max-w-lg flex flex-col p-0 gap-0 max-sm:fixed max-sm:inset-0 max-sm:w-screen max-sm:h-screen max-sm:max-w-none max-sm:max-h-none max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:top-0 max-sm:left-0">
          <DialogHeader className="p-6 pb-4 border-b text-left shrink-0 max-sm:pt-[calc(1.25rem+env(safe-area-inset-top))]">
            <DialogTitle>Editar Aluno</DialogTitle>
          </DialogHeader>
          <AlunoForm
            aluno={aluno}
            professors={professors}
            onSuccess={() => setOpenEdit(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              {aluno.profile_id
                ? "Excluir este aluno também apagará a conta de acesso vinculada. Esta ação não pode ser desfeita."
                : "Deseja excluir este aluno? Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation */}
      <AlertDialog open={openStatus} onOpenChange={setOpenStatus}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBanned
                ? "Reativar conta do aluno?"
                : "Desativar conta do aluno?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBanned
                ? "Deseja reativar o acesso deste aluno à plataforma? Ele poderá fazer login normalmente."
                : "Desativar este aluno impedirá que ele faça login na plataforma e revogará todas as sessões ativas imediatamente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleToggleStatus()}
              disabled={isUpdatingStatus}
              variant={isBanned ? "default" : "destructive"}
            >
              {isUpdatingStatus
                ? "Atualizando..."
                : isBanned
                  ? "Reativar"
                  : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
