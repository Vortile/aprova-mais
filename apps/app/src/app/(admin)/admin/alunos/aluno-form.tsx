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
import { saveAluno } from "@/lib/actions/alunos";
import type { Database } from "@repo/db";

type AlunoRow = Database["public"]["Tables"]["alunos"]["Row"] & {
  profiles?: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "full_name"
  > | null;
};

type ProfessorOption = {
  id: string;
  full_name: string | null;
};

const schema = z.object({
  full_name: z.string().trim().min(1, "Informe o nome do aluno"),
  contact_email: z
    .string()
    .trim()
    .email("Informe um email válido")
    .or(z.literal("")),
  monthly_amount: z.string().trim().optional(),
  address: z.string().trim().optional(),
  grade: z.string().min(1, "Informe a série"),
  subject_focus: z.string(),
  notes: z.string(),
  professor_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AlunoForm({
  aluno,
  professors,
  onSuccess,
}: {
  aluno: AlunoRow | null;
  professors: ProfessorOption[];
  onSuccess: () => void;
}) {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: aluno?.profiles?.full_name ?? "",
      contact_email: aluno?.contact_email ?? "",
      monthly_amount:
        aluno?.monthly_amount != null ? String(aluno.monthly_amount) : "",
      address: aluno?.address ?? "",
      grade: aluno?.grade ?? "",
      subject_focus: aluno?.subject_focus?.join(", ") ?? "",
      notes: aluno?.notes ?? "",
      professor_id: aluno?.professor_id ?? "none",
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await saveAluno({
      alunoId: aluno?.id,
      fullName: values.full_name,
      contactEmail: values.contact_email,
      monthlyAmount: values.monthly_amount,
      address: values.address,
      grade: values.grade,
      subjectFocus: values.subject_focus,
      notes: values.notes,
      professorId:
        values.professor_id === "none" ? null : (values.professor_id ?? null),
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
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome completo do aluno"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email da conta</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="aluno@exemplo.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Use este email para vincular uma conta existente, enviar um
                convite ou alterar o email de login do aluno.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="monthly_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensalidade (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 350.00"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Valor acordado com este aluno.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Série / Ano</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 8º Ano, Ensino Médio 1..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, número, bairro, cidade" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject_focus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disciplinas</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Matemática, Física (separar por vírgula)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Input placeholder="Notas sobre o aluno..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {professors.length > 0 && (
          <FormField
            control={form.control}
            name="professor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professor responsável</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sem professor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sem professor</SelectItem>
                    {professors.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name ?? p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
