"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlunoForm } from "../aluno-form";
import type { Database } from "@repo/db";

type AlunoRow = Database["public"]["Tables"]["alunos"]["Row"] & {
  profiles: {
    full_name: string | null;
  } | null;
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Pencil className="h-4 w-4" />
        Editar Aluno
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-lg flex flex-col p-0 gap-0 max-sm:fixed max-sm:inset-0 max-sm:w-screen max-sm:h-screen max-sm:max-w-none max-sm:max-h-none max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:top-0 max-sm:left-0">
          <DialogHeader className="p-6 pb-4 border-b text-left shrink-0 max-sm:pt-[calc(1.25rem+env(safe-area-inset-top))]">
            <DialogTitle>Editar Aluno</DialogTitle>
          </DialogHeader>
          <AlunoForm
            aluno={aluno}
            professors={professors}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
