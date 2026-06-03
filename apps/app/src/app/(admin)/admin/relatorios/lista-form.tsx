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
import { DISCIPLINAS } from "@/lib/relatorios-constants";
import { saveRegistroLista } from "@/lib/actions/relatorios";

type AlunoOption = {
  id: string;
  contact_email: string | null;
  profiles: { full_name: string | null } | null;
};

const schema = z.object({
  alunoId: z.string().uuid("Selecione um aluno"),
  disciplina: z.enum(DISCIPLINAS, {
    errorMap: () => ({ message: "Selecione uma disciplina" }),
  }),
  dataAula: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  conteudoMinistrado: z.string().trim().min(1, "Informe o conteúdo ministrado"),
  quantidadeAcertos: z.coerce
    .number()
    .int()
    .min(0, "Não pode ser negativo"),
  totalQuestoes: z.coerce
    .number()
    .int()
    .min(1, "Total de questões deve ser ao menos 1"),
});

type FormValues = z.infer<typeof schema>;

export function RegistroListaForm({
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
      disciplina: undefined,
      dataAula: "",
      conteudoMinistrado: "",
      quantidadeAcertos: 0,
      totalQuestoes: 0,
    },
  });

  async function onSubmit(values: FormValues) {
    if (values.quantidadeAcertos > values.totalQuestoes) {
      form.setError("quantidadeAcertos", {
        message: "Acertos não pode ser maior que o total de questões",
      });
      return;
    }

    const result = await saveRegistroLista(values);

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

        <FormField
          control={form.control}
          name="dataAula"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data da aula / aplicação *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="conteudoMinistrado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo ministrado *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Óptica, Cinemática, Funções"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantidadeAcertos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade de acertos *</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalQuestoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total de questões *</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Registro"}
        </Button>
      </form>
    </Form>
  );
}
