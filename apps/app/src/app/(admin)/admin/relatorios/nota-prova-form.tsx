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
import { saveNotaProva } from "@/lib/actions/relatorios";

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
  dataProva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  descricao: z.string().trim().min(1, "Descreva a prova"),
  nota: z.coerce.number().min(0, "Nota não pode ser negativa"),
  notaMaxima: z.coerce.number().min(0.1, "Nota máxima deve ser maior que 0"),
});

type FormValues = z.infer<typeof schema>;

export function NotaProvaForm({
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
      dataProva: "",
      descricao: "",
      nota: 0,
      notaMaxima: 10,
    },
  });

  async function onSubmit(values: FormValues) {
    if (values.nota > values.notaMaxima) {
      form.setError("nota", {
        message: "Nota não pode ser maior que a nota máxima",
      });
      return;
    }

    const result = await saveNotaProva(values);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    form.reset({ notaMaxima: 10 });
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
          name="dataProva"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data da prova *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da prova *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Prova bimestral de Matemática — 1º bimestre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nota"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota obtida *</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notaMaxima"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota máxima *</FormLabel>
                <FormControl>
                  <Input type="number" min={0.1} step={0.1} {...field} />
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
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Nota"}
        </Button>
      </form>
    </Form>
  );
}
