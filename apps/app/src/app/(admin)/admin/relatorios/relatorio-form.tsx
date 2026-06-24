"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DISCIPLINAS,
  STATUS_CONTEUDO_VALUES,
} from "@/lib/relatorios-constants";
import { saveRelatorioPedagogico } from "@/lib/actions/relatorios";

type AlunoOption = {
  id: string;
  contact_email: string | null;
  profiles: { full_name: string | null } | null;
};

const schema = z
  .object({
    alunoId: z.string().uuid("Selecione um aluno"),
    dataSemana: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    disciplina: z.string().trim().min(1, "Selecione uma disciplina"),
    disciplinaPersonalizada: z.string().trim().optional(),
    cargaHoraria: z.string().trim().min(1, "Informe a carga horária"),
    statusConteudo: z.enum(STATUS_CONTEUDO_VALUES, {
      errorMap: () => ({ message: "Selecione um status" }),
    }),
    engajamento: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0")
      .max(100, "Máximo 100"),
  })
  .refine(
    (data) => {
      if (data.disciplina === "Outras") {
        return !!data.disciplinaPersonalizada;
      }
      return true;
    },
    {
      message: "Informe qual é a outra disciplina",
      path: ["disciplinaPersonalizada"],
    },
  );

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
      dataSemana: "",
      disciplina: "",
      disciplinaPersonalizada: "",
      cargaHoraria: "",
      statusConteudo: undefined,
      engajamento: 70,
    },
  });

  async function onSubmit(values: FormValues) {
    const finalDisciplina =
      values.disciplina === "Outras" && values.disciplinaPersonalizada
        ? values.disciplinaPersonalizada
        : values.disciplina;

    const result = await saveRelatorioPedagogico({
      alunoId: values.alunoId,
      dataSemana: values.dataSemana,
      disciplinas: [finalDisciplina],
      cargaHoraria: values.cargaHoraria,
      statusConteudo: values.statusConteudo,
      engajamento: values.engajamento,
    });

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
        <div className="bg-[#1f4e79]/5 border border-[#1f4e79]/20 rounded-lg p-3 text-xs text-slate-700 leading-relaxed">
          <strong>Relatório Pedagógico:</strong> Destinado ao registro do
          desenvolvimento geral do aluno. Serve para reportar a disciplina
          estudada, a data do relatório, a carga horária de aula executada, o
          status do cumprimento do conteúdo pedagógico escolar e uma avaliação
          do nível de engajamento e foco do estudante.
        </div>

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
                      {aluno.profiles?.full_name ??
                        aluno.contact_email ??
                        "Sem nome"}
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
          name="dataSemana"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Relatório *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="disciplina"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disciplina *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DISCIPLINAS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("disciplina") === "Outras" && (
          <FormField
            control={form.control}
            name="disciplinaPersonalizada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Qual disciplina? *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Redação, Filosofia, etc."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
