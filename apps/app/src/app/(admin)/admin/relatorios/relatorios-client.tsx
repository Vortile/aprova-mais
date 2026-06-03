"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RelatorioPedagogicoForm } from "./relatorio-form";
import { RegistroListaForm } from "./lista-form";
import { NotaProvaForm } from "./nota-prova-form";
import { RelatoriosChart, type ChartDataPoint } from "./relatorios-chart";

type AlunoOption = {
  id: string;
  contact_email: string | null;
  profiles: { full_name: string | null } | null;
};

interface Props {
  alunos: AlunoOption[];
  selectedAlunoId: string | null;
  chartData: ChartDataPoint[];
}

type TimeFilter = "1m" | "3m" | "all";

const TIME_FILTERS: { label: string; value: TimeFilter }[] = [
  { label: "Último mês", value: "1m" },
  { label: "Últimos 3 meses", value: "3m" },
  { label: "Todo período", value: "all" },
];

function filterByTime(data: ChartDataPoint[], filter: TimeFilter): ChartDataPoint[] {
  if (filter === "all") return data;
  const now = Date.now();
  const cutoff = filter === "1m" ? now - 30 * 24 * 60 * 60 * 1000 : now - 90 * 24 * 60 * 60 * 1000;
  return data.filter((d) => d.dateMs >= cutoff);
}

export function RelatoriosClient({ alunos, selectedAlunoId, chartData }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("3m");

  const selectedAluno = alunos.find((a) => a.id === selectedAlunoId) ?? null;

  function handleAlunoChange(id: string) {
    startTransition(() => {
      router.push(`/admin/relatorios?alunoId=${id}`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registre relatórios pedagógicos semanais e listas de atividades dos alunos.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={alunos.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Novo registro
        </Button>
      </div>

      {alunos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhum aluno vinculado ao seu perfil ainda.
          </p>
        </div>
      ) : (
        <>
          {/* Aluno selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium shrink-0">Visualizar aluno:</span>
            <Select
              value={selectedAlunoId ?? ""}
              onValueChange={handleAlunoChange}
              disabled={isPending}
            >
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Selecione um aluno para ver o gráfico" />
              </SelectTrigger>
              <SelectContent>
                {alunos.map((aluno) => (
                  <SelectItem key={aluno.id} value={aluno.id}>
                    {aluno.profiles?.full_name ?? aluno.contact_email ?? "Sem nome"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chart */}
          {selectedAluno && (
            <div className="space-y-3">
              {/* Time filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Período:</span>
                <div className="flex gap-1">
                  {TIME_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setTimeFilter(f.value)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        timeFilter === f.value
                          ? "bg-[#1f4e79] text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <RelatoriosChart
                data={filterByTime(chartData, timeFilter)}
                nomeAluno={selectedAluno.profiles?.full_name ?? selectedAluno.contact_email ?? "Aluno"}
              />
            </div>
          )}

          {!selectedAluno && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Selecione um aluno acima para visualizar o gráfico de desempenho.
              </p>
            </div>
          )}
        </>
      )}

      {/* New record dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Registro</DialogTitle>
            <DialogDescription>
              Preencha o formulário correspondente ao tipo de registro.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="relatorio">
            <TabsList className="w-full">
              <TabsTrigger value="relatorio" className="flex-1">
                Relatório Pedagógico
              </TabsTrigger>
              <TabsTrigger value="lista" className="flex-1">
                Lista de Atividade
              </TabsTrigger>
              <TabsTrigger value="prova" className="flex-1">
                Nota de Prova
              </TabsTrigger>
            </TabsList>

            <TabsContent value="relatorio" className="mt-4">
              <RelatorioPedagogicoForm
                alunos={alunos}
                onSuccess={() => setOpen(false)}
              />
            </TabsContent>

            <TabsContent value="lista" className="mt-4">
              <RegistroListaForm
                alunos={alunos}
                onSuccess={() => setOpen(false)}
              />
            </TabsContent>

            <TabsContent value="prova" className="mt-4">
              <NotaProvaForm
                alunos={alunos}
                onSuccess={() => setOpen(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
