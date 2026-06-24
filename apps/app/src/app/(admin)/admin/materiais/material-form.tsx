"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMaterial, updateMaterial } from "@/lib/actions/materiais";

type EditingMaterial = {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  uploaded_by?: string | null;
};

const schema = z.object({
  title: z.string().min(1, "Informe o título"),
  description: z.string(),
  subject: z.string(),
  grade_level: z.string(),
  uploaded_by: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export function MaterialForm({
  onSuccess,
  material,
  isAdmin,
  professores = [],
}: {
  onSuccess: () => void;
  material?: EditingMaterial | null;
  isAdmin?: boolean;
  professores?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(material);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const formSchema = z
    .object({
      title: z.string().min(1, "Informe o título"),
      description: z.string(),
      subject: z.string(),
      grade_level: z.string(),
      uploaded_by: z.string().optional().nullable(),
    })
    .superRefine((data, ctx) => {
      if (isAdmin && (!data.uploaded_by || data.uploaded_by.trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione o professor proprietário",
          path: ["uploaded_by"],
        });
      }
    });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: material?.title ?? "",
      description: material?.description ?? "",
      subject: material?.subject ?? "",
      grade_level: material?.grade_level ?? "",
      uploaded_by: material?.uploaded_by ?? "",
    },
  });

  function handleFileSelection(file: File | null) {
    setSelectedFile(file);
  }

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/material-upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      ok: boolean;
      path?: string;
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.path) {
      throw new Error(payload.error ?? "Não foi possível enviar o arquivo.");
    }

    return payload.path;
  }

  async function onSubmit(values: FormValues) {
    if (isEditing && material) {
      const result = await updateMaterial({
        materialId: material.id,
        title: values.title,
        description: values.description,
        subject: values.subject,
        gradeLevel: values.grade_level,
        uploadedBy: values.uploaded_by || null,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      startTransition(() => {
        router.refresh();
        onSuccess();
      });
      return;
    }

    // Create mode — file is required
    if (!selectedFile) {
      toast.error("Envie um arquivo para o material.");
      return;
    }

    setIsUploading(true);

    let filePath: string;

    try {
      filePath = await uploadFile(selectedFile);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o arquivo.",
      );
      setIsUploading(false);
      return;
    }

    const result = await createMaterial({
      title: values.title,
      description: values.description,
      filePath,
      subject: values.subject,
      gradeLevel: values.grade_level,
      uploadedBy: values.uploaded_by || null,
    });

    setIsUploading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    startTransition(() => {
      router.refresh();
      onSuccess();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Lista de Exercícios — Cap. 3"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disciplina</FormLabel>
                <FormControl>
                  <Input placeholder="Matemática" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="grade_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Série</FormLabel>
                <FormControl>
                  <Input placeholder="8º Ano" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isAdmin && (
          <FormField
            control={form.control}
            name="uploaded_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professor Proprietário *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o professor..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {professores.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhum professor cadastrado
                      </SelectItem>
                    ) : (
                      professores.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione o professor a quem este material pertence.
                  Administradores não podem ser proprietários de materiais de
                  estudo.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder="Breve descrição do material..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
          <FormItem>
            <FormLabel>Arquivo *</FormLabel>
            <FormControl>
              <div
                role="button"
                tabIndex={0}
                className={`rounded-lg border border-dashed p-6 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  handleFileSelection(event.dataTransfer.files[0] ?? null);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(event) =>
                    handleFileSelection(event.target.files?.[0] ?? null)
                  }
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-muted p-3">
                    <FileUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Arraste o arquivo aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      O material será enviado para o bucket aprova+ no Supabase
                      Storage.
                    </p>
                  </div>
                  {selectedFile ? (
                    <p className="text-sm text-foreground">
                      {selectedFile.name} ·{" "}
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  ) : null}
                </div>
              </div>
            </FormControl>
            {!selectedFile ? (
              <FormMessage>Envie um arquivo para continuar.</FormMessage>
            ) : null}
          </FormItem>
        )}

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || isUploading || isPending}
          >
            {form.formState.isSubmitting || isUploading || isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : isEditing ? (
              "Salvar alterações"
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
