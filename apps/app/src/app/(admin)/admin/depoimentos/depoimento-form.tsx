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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { saveDepoimento, updateDepoimento } from "@/lib/actions/depoimentos";
import type { Database } from "@repo/db";

type Depoimento = Database["public"]["Tables"]["depoimentos"]["Row"];

const schema = z.object({
  quote: z.string().trim().min(1, "Informe o depoimento"),
  author: z.string().trim().min(1, "Informe o autor"),
  sort_order: z.string().trim(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function DepoimentoForm({
  depoimento,
  onSuccess,
}: {
  depoimento?: Depoimento;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quote: depoimento?.quote ?? "",
      author: depoimento?.author ?? "",
      sort_order: depoimento?.sort_order?.toString() ?? "0",
      active: depoimento?.active ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      quote: values.quote,
      author: values.author,
      sort_order: Number(values.sort_order) || 0,
      active: values.active,
    };

    const result = depoimento
      ? await updateDepoimento(depoimento.id, payload)
      : await saveDepoimento(payload);

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
          name="quote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Depoimento</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Meu filho tinha pavor de física..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Autor</FormLabel>
              <FormControl>
                <Input placeholder="Ex: — Mãe do João, 9º ano" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-2">
                <FormLabel className="text-sm font-medium leading-none">
                  Visível no site
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Salvando..."
              : depoimento
                ? "Salvar alterações"
                : "Criar depoimento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
