"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Phone,
  Plus,
  Pencil,
  Trash2,
  User,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { saveContato, deleteContato } from "@/lib/actions/alunos";
import type { Database } from "@repo/db";

type ContatoRow = Database["public"]["Tables"]["aluno_contatos"]["Row"];

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do contato"),
  telefone: z.string().trim().min(1, "Informe o telefone do contato"),
  papel: z.string().trim().min(1, "Informe o papel (ex: Mãe, Pai, Tio)"),
});

type FormValues = z.infer<typeof schema>;

export function AlunoContatosCard({
  alunoId,
  contatos,
  isAdmin,
}: {
  alunoId: string;
  contatos: ContatoRow[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContatoRow | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      telefone: "",
      papel: "",
    },
  });

  function handleAdd() {
    setEditing(null);
    form.reset({
      nome: "",
      telefone: "",
      papel: "",
    });
    setOpen(true);
  }

  function handleEdit(contato: ContatoRow) {
    setEditing(contato);
    form.reset({
      nome: contato.nome,
      telefone: contato.telefone,
      papel: contato.papel,
    });
    setOpen(true);
  }

  async function handleDelete(contatoId: string) {
    if (!confirm("Tem certeza que deseja excluir este contato?")) {
      return;
    }

    const result = await deleteContato(contatoId, alunoId);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    startTransition(() => {
      router.refresh();
    });
  }

  async function onSubmit(values: FormValues) {
    const result = await saveContato({
      id: editing?.id,
      alunoId,
      nome: values.nome,
      telefone: values.telefone,
      papel: values.papel,
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }

  function getWhatsAppUrl(phone: string) {
    const cleanNumber = phone.replace(/\D/g, "");
    // If the number doesn't start with a country code, assume Brazil (+55)
    const formatted = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    return `https://wa.me/${formatted}`;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Contatos e Responsáveis</CardTitle>
          </div>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {contatos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">
              Nenhum contato dos pais ou responsáveis cadastrado.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {contatos.map((contato) => (
                <div
                  key={contato.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{contato.nome}</span>
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        {contato.papel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{contato.telefone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={getWhatsAppUrl(contato.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground text-green-600 dark:text-green-400"
                      title="Enviar mensagem no WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                    
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEdit(contato)}
                          title="Editar contato"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive/90"
                          onClick={() => void handleDelete(contato.id)}
                          title="Excluir contato"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Contato" : "Adicionar Novo Contato"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Antonia, Cintia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone / Celular</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: +5592999999999 ou (92) 99999-9999" {...field} />
                    </FormControl>
                    <FormDescription>
                      Coloque preferencialmente com código de país e DDD.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="papel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Papel / Parentesco</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Mãe, Pai, Tio, Responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
