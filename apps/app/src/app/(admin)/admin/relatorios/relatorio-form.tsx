"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { DISCIPLINAS, STATUS_CONTEUDO_VALUES } from "@/lib/relatorios-constants";
import { saveRelatorioPedagogico } from "@/lib/actions/relatorios";

type AlunoOption = {
  id: string;
  contact_email: string | null;
  profiles: { full_name: string | null } | null;
};

const schema = z.object({
  alunoId: z.string().uuid("Selecione um aluno"),
  disciplinas: z
    .array(z.enum(DISCIPLINAS))
    .min(1, "Selecione ao menos uma disciplina"),
  cargaHoraria: z.string().trim().min(1, "Informe a carga horária"),
  statusConteudo: z.enum(STATUS_CONTEUDO_VALUES, {
    errorMap: () => ({ message: "Selecione um status" }),
  }),
  engajamento: z.coerce
    .number()
    .int()
    .min(0, "Mínimo 0")
    .max(100, "Máximo 100"),
});

type FormValues = z.infer<typeof schema>;

export function RelatorioPedagogicoForm({
  alunos,
  onSuccess,
}: {
  alunos: AlunoOption[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      alunoId: "",
      disciplinas: [],
      cargaHoraria: "",
      statusConteudo: undefined,
      engajamento: 70,
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await saveRelatorioPedagogico(values);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    form.reset();
    router.refresh();
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="alunoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aluno *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {alunos.map((aluno) => (
                    <SelectItem key={aluno.id} value={aluno.id}>
                      {aluno.profiles?.full_name ?? aluno.contact_email ?? "Sem nome"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="disciplinas"
          render={() => (
            <FormItem>
              <FormLabel>Disciplinas ministradas nesta semana *</FormLabel>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {DISCIPLINAS.map((disciplina) => (
                  <FormField
                    key={disciplina}
                    control={form.control}
                    name="disciplinas"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(disciplina)}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked
                                  ? [...current, disciplina]
                                  : current.filter((d) => d !== disciplina),
                              );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {disciplina}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cargaHoraria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carga horária executada *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 2h, 1h30min" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="statusConteudo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status do cumprimento do conteúdo escolar *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUS_CONTEUDO_VALUES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="engajamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Índice de Engajamento e Foco ({field.value}%)
              </FormLabel>
              <FormControl>
                <Input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  {...field}
                  className="h-2 w-full cursor-pointer accent-green-500"
                />
              </FormControl>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 — Muito baixo</span>
                <span>50 — Regular</span>
                <span>100 — Excelente</span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Relatório"}
        </Button>
      </form>
    </Form>
  );
}
