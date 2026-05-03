"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Download,
  Trash2,
  Pencil,
  User,
  UserPlus,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteMaterial,
  updateMaterialAssignments,
} from "@/lib/actions/materiais";
import { MaterialForm } from "./material-form";
import type { Database } from "@repo/db";

type MaterialRow = Database["public"]["Tables"]["materiais"]["Row"] & {
  download_url: string | null;
  uploader_name: string | null;
};

type AlunoOption = { id: string; name: string };

export function MateriaisClient({
  materiais,
  isAdmin,
  alunos,
  assignmentsByMaterial,
}: {
  materiais: MaterialRow[];
  isAdmin: boolean;
  alunos: AlunoOption[];
  assignmentsByMaterial: Record<string, string[]>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaterialRow | null>(null);
  const [assigningMaterial, setAssigningMaterial] =
    useState<MaterialRow | null>(null);
  const [selectedAlunoIds, setSelectedAlunoIds] = useState<Set<string>>(
    new Set(),
  );
  const [savingAssign, setSavingAssign] = useState(false);
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");

  const uniqueSubjects = [
    ...new Set(materiais.map((m) => m.subject).filter(Boolean)),
  ] as string[];
  const uniqueGrades = [
    ...new Set(materiais.map((m) => m.grade_level).filter(Boolean)),
  ] as string[];

  const filteredMateriais = materiais.filter(
    (m) =>
      (filterSubject === "all" || m.subject === filterSubject) &&
      (filterGrade === "all" || m.grade_level === filterGrade),
  );

  function handleOpenAssign(material: MaterialRow) {
    const current = new Set(assignmentsByMaterial[material.id] ?? []);
    setSelectedAlunoIds(current);
    setAssigningMaterial(material);
  }

  async function handleSaveAssignments() {
    if (!assigningMaterial) return;
    setSavingAssign(true);
    const result = await updateMaterialAssignments({
      materialId: assigningMaterial.id,
      alunoIds: Array.from(selectedAlunoIds),
    });
    setSavingAssign(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setAssigningMaterial(null);
    router.refresh();
  }

  function toggleAluno(alunoId: string) {
    setSelectedAlunoIds((prev) => {
      const next = new Set(prev);
      if (next.has(alunoId)) next.delete(alunoId);
      else next.add(alunoId);
      return next;
    });
  }

  function handleAdd() {
    setEditing(null);
    setOpen(true);
  }

  function handleEdit(material: MaterialRow) {
    setEditing(material);
    setOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);

    const result = await deleteMaterial(deleteTarget.id);

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
          {filteredMateriais.length} material
          {filteredMateriais.length !== 1 ? "is" : ""} cadastrado
          {filteredMateriais.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Material
        </Button>
      </div>

      {/* Filters */}
      {(uniqueSubjects.length > 0 || uniqueGrades.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {uniqueSubjects.length > 0 && (
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as disciplinas</SelectItem>
                {uniqueSubjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {uniqueGrades.length > 0 && (
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Série" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as séries</SelectItem>
                {uniqueGrades.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {filteredMateriais.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            {materiais.length === 0
              ? "Nenhum material cadastrado."
              : "Nenhum material encontrado para os filtros selecionados."}
          </p>
          {materiais.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleAdd}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar primeiro material
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMateriais.map((material) => (
            <Card
              key={material.id}
              className="group hover:shadow-md transition-shadow flex flex-col"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-medium leading-snug">
                    {material.title}
                  </CardTitle>
                  <div className="flex items-center gap-0.5 shrink-0 -mt-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Atribuir a alunos"
                      onClick={() => handleOpenAssign(material)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(material)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      disabled={deletingId === material.id}
                      onClick={() => setDeleteTarget(material)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                {material.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {material.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {material.subject && (
                    <Badge variant="secondary" className="text-xs">
                      {material.subject}
                    </Badge>
                  )}
                  {material.grade_level && (
                    <Badge variant="outline" className="text-xs">
                      {material.grade_level}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2 pt-0">
                <div className="flex items-center gap-2 min-w-0">
                  {isAdmin && material.uploader_name && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">{material.uploader_name}</span>
                    </span>
                  )}
                  {(() => {
                    const count = (assignmentsByMaterial[material.id] ?? [])
                      .length;
                    return count > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <UserPlus className="h-3 w-3 shrink-0" />
                        {count} aluno{count !== 1 ? "s" : ""}
                      </span>
                    ) : null;
                  })()}
                </div>
                {material.download_url && (
                  <a
                    href={material.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex ml-auto"
                  >
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </a>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Material" : "Novo Material"}
            </DialogTitle>
          </DialogHeader>
          <MaterialForm
            material={editing}
            onSuccess={() => {
              setOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
            <AlertDialogDescription>
              O material <strong>{deleteTarget?.title}</strong> e seu arquivo
              serão excluídos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Dialog */}
      <Dialog
        open={!!assigningMaterial}
        onOpenChange={(v) => !v && setAssigningMaterial(null)}
      >
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Atribuir a alunos</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {assigningMaterial?.title}
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {alunos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum aluno cadastrado.
              </p>
            ) : (
              alunos.map((aluno) => (
                <label
                  key={aluno.id}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-muted-foreground"
                    checked={selectedAlunoIds.has(aluno.id)}
                    onChange={() => toggleAluno(aluno.id)}
                  />
                  <span className="text-sm">{aluno.name}</span>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssigningMaterial(null)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={savingAssign}
              onClick={() => void handleSaveAssignments()}
            >
              {savingAssign ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
