"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Upload, FileText, Image as ImageIcon, X, Check } from "lucide-react";
import imageCompression from "browser-image-compression";
import { submitTarefa } from "@/lib/actions/tarefas";

const schema = z.object({
  student_notes: z.string().trim(),
  submission_url: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

interface LocalFile {
  id: string;
  file: File;
  previewUrl: string;
  isImage: boolean;
  name: string;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadText, setUploadText] = useState("");
  
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
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      localFiles.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, [localFiles]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_notes: initialNotes ?? "",
      submission_url: initialUrl ?? "",
    },
  });

  async function handleFileSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    const newLocalFiles = [...localFiles];

    try {
      for (let i = 0; i < files.length; i++) {
        const rawFile = files[i]!;
        
        let fileToStore = rawFile;
        const isImage = rawFile.type.startsWith("image/");
        
        if (isImage) {
          // Compress using browser-image-compression
          const options = {
            maxSizeMB: 1.5, // Max size is 1.5MB (massively smaller than raw camera files!)
            maxWidthOrHeight: 1920, // max dimension
            useWebWorker: true,
          };
          
          toast.info(`Otimizando "${rawFile.name}"...`);
          fileToStore = await imageCompression(rawFile, options);
        }

        const localId = `${Date.now()}-${crypto.randomUUID()}`;
        newLocalFiles.push({
          id: localId,
          file: fileToStore,
          name: rawFile.name,
          isImage,
          previewUrl: isImage ? URL.createObjectURL(fileToStore) : "",
        });
      }

      setLocalFiles(newLocalFiles);
      toast.success("Arquivos preparados com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao otimizar imagem.");
      console.error(error);
    } finally {
      setIsCompressing(false);
      e.target.value = ""; // Reset input
    }
  }

  function handleRemoveUploadedFile(indexToRemove: number) {
    const updated = uploadedFiles.filter((_, idx) => idx !== indexToRemove);
    setUploadedFiles(updated);
    const urlString = updated.length > 0 ? JSON.stringify(updated) : "";
    form.setValue("submission_url", urlString, { shouldDirty: true });
  }

  function handleRemoveLocalFile(idToRemove: string) {
    const file = localFiles.find(f => f.id === idToRemove);
    if (file) {
      if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
    }
    setLocalFiles(prev => prev.filter(f => f.id !== idToRemove));
  }

  async function onSubmit(values: FormValues) {
    if (uploadedFiles.length === 0 && localFiles.length === 0) {
      toast.error("Por favor, envie ao menos uma foto ou arquivo da sua tarefa.");
      return;
    }

    setIsSubmitting(true);
    const finalizedUploadedFiles = [...uploadedFiles];

    try {
      // 1. Upload local files one by one
      for (let i = 0; i < localFiles.length; i++) {
        const local = localFiles[i]!;
        setUploadText(`Enviando arquivo ${i + 1} de ${localFiles.length}...`);

        const formData = new FormData();
        formData.append("file", local.file, local.name);

        const res = await fetch("/api/submission-upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro no upload do arquivo");
        }

        const data = await res.json();
        finalizedUploadedFiles.push(data.path);
      }

      setUploadText("Finalizando envio da tarefa...");
      const finalUrlString = JSON.stringify(finalizedUploadedFiles);

      // 2. Submit the form to DB
      const result = await submitTarefa({
        entregaId,
        studentNotes: values.student_notes,
        submissionUrl: finalUrlString,
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      toast.success(result.message);
      
      // Clean up object URLs
      localFiles.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
      setLocalFiles([]);
      
      router.refresh();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload e enviar tarefa.");
    } finally {
      setIsSubmitting(false);
      setUploadText("");
    }
  }

  const hasFiles = uploadedFiles.length > 0 || localFiles.length > 0;

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
          <FormLabel className="text-sm font-semibold flex items-center justify-between">
            <span>Fotos ou Arquivos da Entrega *</span>
            {localFiles.length > 0 && (
              <span className="text-xs text-amber-600 font-normal">
                {localFiles.length} {localFiles.length === 1 ? "foto/arquivo" : "fotos/arquivos"} aguardando envio
              </span>
            )}
          </FormLabel>
          
          {/* Upload Button Area */}
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50/50 hover:bg-slate-50 border-slate-300 hover:border-[#1f4e79]/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                {isCompressing ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Comprimindo e preparando imagens...</p>
                    <p className="text-xs text-muted-foreground mt-1">Isso reduz o tamanho em até 90% para o upload ficar super rápido!</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#1f4e79] mb-2" />
                    <p className="text-sm text-slate-700 font-semibold mb-1">
                      Clique para tirar fotos ou selecionar arquivos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, JPEG ou PDF (múltiplos permitidos)
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                disabled={isCompressing || isSubmitting}
                onChange={handleFileSelection}
              />
            </label>
          </div>

          {/* Files Grid (Both staged locally and already uploaded) */}
          {hasFiles && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {/* 1. Already Uploaded Files */}
              {uploadedFiles.map((path, idx) => {
                const isImage = /\.(jpe?g|png|gif|webp)$/i.test(path);
                const fileName = path.split("/").pop() || "arquivo";
                
                return (
                  <div
                    key={`uploaded-${idx}`}
                    className="flex items-center justify-between p-2 rounded-lg border border-emerald-200 bg-emerald-50/30 shadow-xs relative"
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
                      <span className="text-[10px] text-emerald-600 bg-emerald-100/50 px-1 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                        <Check className="w-2.5 h-2.5" /> Salvo
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 rounded-full text-slate-400 hover:text-destructive hover:bg-destructive/10 shrink-0"
                      disabled={isSubmitting}
                      onClick={() => handleRemoveUploadedFile(idx)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}

              {/* 2. Staged Local Files waiting to be uploaded */}
              {localFiles.map((local) => (
                <div
                  key={local.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-amber-200 bg-amber-50/20 shadow-xs relative"
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-6">
                    {local.isImage ? (
                      <ImageIcon className="w-4 h-4 shrink-0 text-amber-500" />
                    ) : (
                      <FileText className="w-4 h-4 shrink-0 text-blue-500" />
                    )}
                    <span className="text-xs truncate font-medium text-slate-700">
                      {local.name.length > 25 ? `${local.name.slice(0, 22)}...` : local.name}
                    </span>
                    <span className="text-[10px] text-amber-600 bg-amber-100/50 px-1 py-0.5 rounded shrink-0">
                      Aguardando
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 rounded-full text-slate-400 hover:text-destructive hover:bg-destructive/10 shrink-0"
                    disabled={isSubmitting}
                    onClick={() => handleRemoveLocalFile(local.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <input type="hidden" {...form.register("submission_url")} />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting || isCompressing}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {uploadText || "Enviando..."}
              </>
            ) : (
              "Enviar tarefa"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
