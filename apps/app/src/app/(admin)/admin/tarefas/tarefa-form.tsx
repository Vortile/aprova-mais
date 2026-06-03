"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Database } from "@repo/db";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { saveTarefa } from "@/lib/actions/tarefas";

type AlunoOption = Pick<
  Database["public"]["Tables"]["alunos"]["Row"],
  "id" | "grade" | "contact_email"
> & {
  profiles: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "full_name"
  > | null;
};
type MaterialRow = Pick<
  Database["public"]["Tables"]["materiais"]["Row"],
  "id" | "title" | "subject"
>;

const schema = z.object({
  title: z.string().trim().min(1, "Informe o título"),
  description: z.string().trim(),
  due_date: z.string().trim(),
  material_id: z.string().trim(),
  aluno_ids: z.array(z.string().uuid()).min(1, "Selecione ao menos um aluno"),
});

type FormValues = z.infer<typeof schema>;

export function TarefaForm({
  alunos,
  materiais,
  onSuccess,
}: {
  alunos: AlunoOption[];
  materiais: MaterialRow[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      due_date: "",
      material_id: "",
      aluno_ids: [],
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await saveTarefa({
      title: values.title,
      description: values.description,
      dueDate: values.due_date,
      materialId: values.material_id === "__none" ? "" : values.material_id,
      alunoIds: values.aluno_ids,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Lista de exercícios 07" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orientações</FormLabel>
              <FormControl>
                <textarea
                  className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="Explique o que precisa ser entregue, critérios e observações."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prazo</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="material_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material de apoio</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || "__none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um material" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none">
                      Sem material vinculado
                    </SelectItem>
                    {materiais.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.title}
                        {material.subject ? ` · ${material.subject}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="aluno_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alunos *</FormLabel>
              <FormControl>
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
                  {alunos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Cadastre alunos antes de criar tarefas.
                    </p>
                  ) : (
                    alunos.map((aluno) => {
                      const checked = field.value.includes(aluno.id);
                      const alunoName =
                        aluno.profiles?.full_name ?? aluno.contact_email ?? "Aluno sem nome";

                      return (
                        <label
                          key={aluno.id}
                          className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm hover:bg-muted/40"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-input"
                            checked={checked}
                            onChange={(event) => {
                              const nextValue = event.target.checked
                                ? [...field.value, aluno.id]
                                : field.value.filter(
                                    (value) => value !== aluno.id,
                                  );

                              field.onChange(nextValue);
                            }}
                          />
                          <span className="min-w-0">
                            <span className="block font-medium">
                              {alunoName}
                            </span>
                            {aluno.grade ? (
                              <span className="text-xs text-muted-foreground">
                                {aluno.grade}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Cada aluno selecionado recebe sua própria entrega para
                acompanhamento.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || alunos.length === 0}
          >
            {form.formState.isSubmitting ? "Salvando..." : "Criar tarefa"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
