"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  atualizarDatasEventoAction,
  registrarCheckinAction,
  reenviarIngressoAction,
  type EventoDashboardData,
} from "@/lib/actions/eventos";

function formatCurrency(centavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

function statusBadge(status: string) {
  const map: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    aprovado: { label: "Aprovado", variant: "default" },
    pendente: { label: "Pendente", variant: "secondary" },
    recusado: { label: "Recusado", variant: "destructive" },
    cancelado: { label: "Cancelado", variant: "outline" },
  };
  const config = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const FUNIL_LABELS: Record<keyof EventoDashboardData["funil"], string> = {
  pageViews: "Visitantes da Landing Page",
  ctaClicks: "Cliques no CTA",
  formStarted: "Iniciaram o Formulário",
  formSubmitted: "Enviaram o Formulário",
  pixGenerated: "Geraram PIX",
  cardStarted: "Iniciaram Cartão",
  paymentApproved: "Pagamentos Aprovados",
};

export function EventosClient({ data }: { data: EventoDashboardData }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pendingCheckin, setPendingCheckin] = useState<string | null>(null);
  const [pendingResend, setPendingResend] = useState<string | null>(null);
  const [sabado1, setSabado1] = useState(data.evento.data_sabado_1 ?? "");
  const [sabado2, setSabado2] = useState(data.evento.data_sabado_2 ?? "");
  const [sabado3, setSabado3] = useState(data.evento.data_sabado_3 ?? "");
  const [horarioGeral, setHorarioGeral] = useState(
    data.evento.horario_geral ?? "",
  );
  const [salaTurma1, setSalaTurma1] = useState(data.evento.sala_turma_1 ?? "");
  const [salaTurma2, setSalaTurma2] = useState(data.evento.sala_turma_2 ?? "");
  const [savingDatas, setSavingDatas] = useState(false);

  const filteredInscricoes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data.inscricoes;
    return data.inscricoes.filter(
      (row) =>
        row.nome_aluno.toLowerCase().includes(term) ||
        row.email_aluno.toLowerCase().includes(term) ||
        row.cpf_aluno.includes(term),
    );
  }, [data.inscricoes, search]);

  const maxFunil = Math.max(...Object.values(data.funil), 1);

  async function handleCheckin(inscricaoId: string, dia: 1 | 2 | 3) {
    setPendingCheckin(`${inscricaoId}-${dia}`);
    const result = await registrarCheckinAction(inscricaoId, dia);
    setPendingCheckin(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  async function handleResend(inscricaoId: string) {
    setPendingResend(inscricaoId);
    const result = await reenviarIngressoAction(inscricaoId);
    setPendingResend(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
  }

  async function handleSaveDatas() {
    setSavingDatas(true);
    const result = await atualizarDatasEventoAction(data.evento.id, {
      sabado1,
      sabado2,
      sabado3,
      horarioGeral,
      salaTurma1,
      salaTurma2,
    });
    setSavingDatas(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Vagas Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data.vagasConfirmadas} / {data.evento.limite_total_vagas}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Sala 1
              {data.evento.sala_turma_1 ? ` (${data.evento.sala_turma_1})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data.turma1Ocupadas} / {data.evento.capacidade_por_turma}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Sala 2
              {data.evento.sala_turma_2 ? ` (${data.evento.sala_turma_2})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data.turma2Ocupadas} / {data.evento.capacidade_por_turma}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Faturamento Bruto
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCurrency(data.faturamentoBrutoCentavos)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(FUNIL_LABELS) as Array<keyof typeof FUNIL_LABELS>).map(
            (key) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{FUNIL_LABELS[key]}</span>
                  <span className="font-semibold">{data.funil[key]}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${(data.funil[key] / maxFunil) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ),
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datas, Horário e Salas dos 3 Sábados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-wrap">
            <label className="flex flex-col gap-1 text-sm">
              Sábado 1
              <Input
                type="date"
                value={sabado1}
                onChange={(e) => setSabado1(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sábado 2
              <Input
                type="date"
                value={sabado2}
                onChange={(e) => setSabado2(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sábado 3
              <Input
                type="date"
                value={sabado3}
                onChange={(e) => setSabado3(e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-wrap">
            <label className="flex flex-col gap-1 text-sm">
              Horário (mesmo para todas as salas)
              <Input
                placeholder="08:00 às 12:00"
                value={horarioGeral}
                onChange={(e) => setHorarioGeral(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sala 1
              <Input
                placeholder="Sala HY"
                value={salaTurma1}
                onChange={(e) => setSalaTurma1(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sala 2
              <Input
                placeholder="A definir"
                value={salaTurma2}
                onChange={(e) => setSalaTurma2(e.target.value)}
              />
            </label>
            <Button onClick={handleSaveDatas} disabled={savingDatas}>
              {savingDatas ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inscrições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por nome, e-mail ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInscricoes.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.nome_aluno}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.email_aluno}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.turma_alocada
                        ? `Turma ${row.turma_alocada} (${row.horario_turma})`
                        : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(row.status_pagamento)}</TableCell>
                    <TableCell className="capitalize">
                      {row.forma_pagamento ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {([1, 2, 3] as const).map((dia) => (
                          <Button
                            key={dia}
                            size="sm"
                            variant="outline"
                            disabled={
                              row.status_pagamento !== "aprovado" ||
                              pendingCheckin === `${row.id}-${dia}`
                            }
                            onClick={() => handleCheckin(row.id, dia)}
                          >
                            D{dia}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          row.status_pagamento !== "aprovado" ||
                          pendingResend === row.id
                        }
                        onClick={() => handleResend(row.id)}
                      >
                        Reenviar ingresso
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredInscricoes.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      Nenhuma inscrição encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
