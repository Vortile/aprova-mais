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
import { updateProfessor } from "@/lib/actions/professores";
import type { Database } from "@repo/db";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const schema = z.object({
  fullName: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres"),
  address: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProfessorEditForm({
  professor,
  onSuccess,
}: {
  professor: ProfileRow;
  onSuccess: () => void;
}) {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: professor.full_name ?? "",
      address: professor.address ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await updateProfessor({
      profileId: professor.id,
      fullName: values.fullName,
      address: values.address,
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
        <div className="space-y-1">
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-muted-foreground">
            {professor.email ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            O email de login não pode ser alterado por aqui.
          </p>
        </div>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do professor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, número, bairro, cidade" {...field} />
              </FormControl>
              <FormDescription>Opcional.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
