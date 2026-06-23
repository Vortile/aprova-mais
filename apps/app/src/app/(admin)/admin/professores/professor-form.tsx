"use client";

import { useTransition } from "react";
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
import { saveProfessor } from "@/lib/actions/professores";

const schema = z.object({
  fullName: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().trim().email("Informe um email válido"),
  address: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProfessorForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", address: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await saveProfessor(values);

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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="professor@email.com"
                  {...field}
                />
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
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || isPending}
          >
            {form.formState.isSubmitting || isPending
              ? "Enviando..."
              : "Enviar convite"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
