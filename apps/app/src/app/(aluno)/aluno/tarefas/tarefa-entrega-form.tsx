"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2, Upload, FileText, Image as ImageIcon, X } from "lucide-react";
import { submitTarefa } from "@/lib/actions/tarefas";

const schema = z.object({
  student_notes: z.string().trim(),
  submission_url: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

export function TarefaEntregaForm({
  entregaId,
  initialNotes,
  initialUrl,
  onSuccess,
}: {
  entregaId: string;
  initialNotes: string | null;
  initialUrl: string | null;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  
  // Parse initial files if any (saved as comma-separated or JSON list of urls/paths)
  const getInitialFiles = (): string[] => {
    if (!initialUrl) return [];
    try {
      if (initialUrl.startsWith("[")) {
        return JSON.parse(initialUrl) as string[];
      }
      return initialUrl.split(",").map(f => f.trim()).filter(Boolean);
    } catch {
      return [initialUrl];
    }
  };

  const [uploadedFiles, setUploadedFiles] = useState<string[]>(getInitialFiles());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_notes: initialNotes ?? "",
      submission_url: initialUrl ?? "",
    },
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUploadedFiles = [...uploadedFiles];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/submission-upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro no upload do arquivo");
        }

        const data = await res.json();
        newUploadedFiles.push(data.path);
      }

      setUploadedFiles(newUploadedFiles);
      const urlString = JSON.stringify(newUploadedFiles);
      form.setValue("submission_url", urlString, { shouldValidate: true, shouldDirty: true });
      toast.success("Arquivos enviados com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload dos arquivos.");
    } finally {
      setIsUploading(false);
      // Reset input element
      e.target.value = "";
    }
  }

  function handleRemoveFile(indexToRemove: number) {
    const updated = uploadedFiles.filter((_, idx) => idx !== indexToRemove);
    setUploadedFiles(updated);
    const urlString = updated.length > 0 ? JSON.stringify(updated) : "";
    form.setValue("submission_url", urlString, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(values: FormValues) {
    if (uploadedFiles.length === 0) {
      toast.error("Por favor, envie ao menos uma foto ou arquivo da sua tarefa.");
      return;
    }

    const result = await submitTarefa({
      entregaId,
      studentNotes: values.student_notes,
      submissionUrl: values.submission_url,
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    router.refresh();
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="student_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumo da resposta</FormLabel>
              <FormControl>
                <textarea
                  className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="Explique o que você fez, dúvidas e observações."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel className="text-sm font-semibold">Fotos ou Arquivos da Entrega *</FormLabel>
          
          {/* Upload Button Area */}
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50/50 hover:bg-slate-50 border-slate-300 hover:border-[#1f4e79]/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-[#1f4e79] mb-2" />
                    <p className="text-xs text-muted-foreground">Enviando arquivos...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#1f4e79] mb-2" />
                    <p className="text-sm text-slate-700 font-semibold mb-1">
                      Clique para tirar fotos ou enviar arquivos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, JPEG ou PDF (máx 15MB por arquivo, múltiplos permitidos)
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Uploaded Files Grid */}
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {uploadedFiles.map((path, idx) => {
                const isImage = /\.(jpe?g|png|gif|webp)$/i.test(path);
                const fileName = path.split("/").pop() || "arquivo";
                
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg border bg-white shadow-xs relative group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-6">
                      {isImage ? (
                        <ImageIcon className="w-4 h-4 shrink-0 text-emerald-500" />
                      ) : (
                        <FileText className="w-4 h-4 shrink-0 text-blue-500" />
                      )}
                      <span className="text-xs truncate font-medium text-slate-700">
                        {fileName.length > 25 ? `${fileName.slice(0, 22)}...` : fileName}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 rounded-full text-slate-400 hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRemoveFile(idx)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <input type="hidden" {...form.register("submission_url")} />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
            {form.formState.isSubmitting ? "Enviando..." : "Enviar tarefa"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
