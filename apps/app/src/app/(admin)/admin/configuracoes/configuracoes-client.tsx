"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { updateOwnProfile } from "@/lib/actions/profile";
import type { Database } from "@repo/db";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  professor: "Professor",
  aluno: "Aluno",
};

const schema = z.object({
  full_name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export function ConfiguracoesClient({
  user,
}: {
  user: { id: string; email: string; profile: Profile };
}) {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user.profile?.full_name ?? "",
    },
  });

  const initials = user.profile?.full_name
    ? user.profile.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (user.email[0]?.toUpperCase() ?? "P");

  async function onSubmit(values: FormValues) {
    const result = await updateOwnProfile({
      profileId: user.id,
      fullName: values.full_name,
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium">
                {user.profile?.full_name ?? "Professor"}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.profile?.role && (
                <Badge variant="secondary">
                  {ROLE_LABELS[user.profile.role] ?? user.profile.role}
                </Badge>
              )}
            </div>
          </div>
          <Separator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="mt-2 opacity-60"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Salvando..."
                    : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações da conta</CardTitle>
          <CardDescription>
            Detalhes sobre sua conta na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Função
              </p>
              <div className="mt-1">
                {user.profile?.role ? (
                  <Badge variant="secondary">
                    {ROLE_LABELS[user.profile.role] ?? user.profile.role}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Membro desde
              </p>
              <p className="mt-1 text-sm">
                {user.profile?.created_at
                  ? new Date(user.profile.created_at).toLocaleDateString(
                      "pt-BR",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )
                  : "—"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              ID da conta
            </p>
            <p className="mt-1 text-xs text-muted-foreground font-mono break-all">
              {user.id}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
