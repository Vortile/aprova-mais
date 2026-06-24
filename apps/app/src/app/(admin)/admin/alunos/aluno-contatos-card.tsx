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
  Copy,
  PhoneCall,
  Users2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

const SUGGESTED_ROLES = [
  "Mãe",
  "Pai",
  "Responsável Legal",
  "Avô/Avó",
  "Tio/Tia",
  "Outro",
];

function getRoleStyles(papel: string) {
  const normalized = papel.toLowerCase().trim();
  if (normalized.includes("mãe") || normalized.includes("mae")) {
    return {
      badgeClass:
        "bg-pink-100 text-pink-700 hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200/30",
      avatarClass: "bg-gradient-to-br from-pink-400 to-pink-600 text-white",
    };
  }
  if (normalized.includes("pai")) {
    return {
      badgeClass:
        "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/30",
      avatarClass: "bg-gradient-to-br from-blue-400 to-blue-600 text-white",
    };
  }
  if (normalized.includes("tio") || normalized.includes("tia")) {
    return {
      badgeClass:
        "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/30",
      avatarClass: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
    };
  }
  if (
    normalized.includes("avó") ||
    normalized.includes("avô") ||
    normalized.includes("avo")
  ) {
    return {
      badgeClass:
        "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/30",
      avatarClass: "bg-gradient-to-br from-purple-400 to-purple-600 text-white",
    };
  }
  if (
    normalized.includes("responsável") ||
    normalized.includes("responsavel") ||
    normalized.includes("legal")
  ) {
    return {
      badgeClass:
        "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/30",
      avatarClass:
        "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
    };
  }
  return {
    badgeClass:
      "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-700/30",
    avatarClass: "bg-gradient-to-br from-slate-400 to-slate-600 text-white",
  };
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPhoneForDisplay(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 13 && cleaned.startsWith("55")) {
    return `+55 (${cleaned.substring(2, 4)}) ${cleaned.substring(4, 9)}-${cleaned.substring(9)}`;
  }
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  return phone;
}

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
    const formatted =
      cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    return `https://wa.me/${formatted}`;
  }

  function handleCopy(phone: string) {
    navigator.clipboard.writeText(phone);
    toast.success("Número de telefone copiado para a área de transferência!");
  }

  return (
    <>
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-primary shrink-0" />
              <CardTitle className="text-base font-semibold">
                Contatos e Responsáveis
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Lista de contatos de pais, familiares e responsáveis
            </CardDescription>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              onClick={handleAdd}
              className="gap-1.5 shadow-sm h-8"
            >
              <Plus className="h-4 w-4" />
              Adicionar Contato
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {contatos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg bg-muted/30">
              <Users2 className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum contato dos pais ou responsáveis cadastrado.
              </p>
              {isAdmin && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleAdd}
                  className="mt-1 text-primary hover:no-underline text-xs"
                >
                  Adicionar o primeiro contato agora
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {contatos.map((contato) => {
                const { badgeClass, avatarClass } = getRoleStyles(
                  contato.papel,
                );
                const initials = getInitials(contato.nome);

                return (
                  <div
                    key={contato.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card/50 shadow-sm transition-all hover:bg-muted/10"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar
                        className={`h-9 w-9 shrink-0 flex items-center justify-center font-bold text-xs select-none ${avatarClass}`}
                      >
                        <AvatarFallback className="bg-transparent text-white font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-medium text-sm text-foreground truncate max-w-[130px] md:max-w-[180px]"
                            title={contato.nome}
                          >
                            {contato.nome}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full select-none ${badgeClass}`}
                          >
                            {contato.papel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-mono">
                            {formatPhoneForDisplay(contato.telefone)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full shrink-0"
                        onClick={() => handleCopy(contato.telefone)}
                        title="Copiar número de telefone"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>

                      <a
                        href={`tel:${contato.telefone}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground text-blue-600 dark:text-blue-400 shrink-0 shadow-sm transition-all"
                        title="Fazer ligação de telefone"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                      </a>

                      <a
                        href={getWhatsAppUrl(contato.telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm transition-all"
                        title="Conversar no WhatsApp"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </a>

                      {isAdmin && (
                        <div className="flex items-center gap-1 border-l border-border pl-1 ml-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                            onClick={() => handleEdit(contato)}
                            title="Editar contato"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
                            onClick={() => void handleDelete(contato.id)}
                            title="Excluir contato"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre as informações de contato para pais ou responsáveis do
              aluno.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pt-2"
            >
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Antonia Maria" {...field} />
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
                      <Input
                        placeholder="Ex: +5592999999999 ou (92) 99999-9999"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px] leading-normal text-muted-foreground">
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
                      <Input
                        placeholder="Ex: Mãe, Pai, Tio, Responsável"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {SUGGESTED_ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => form.setValue("papel", role)}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border bg-muted hover:bg-muted/80 text-muted-foreground transition-all hover:text-foreground"
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
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
