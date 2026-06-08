"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export type ChartDataPoint = {
  /** DD/MM */
  date: string;
  /** Milliseconds epoch — used for sort only */
  dateMs: number;
  listas?: number;
  provas?: number;
  engajamento?: number;
};

interface Props {
  data: ChartDataPoint[];
  nomeAluno: string;
  disciplina?: string;
}

const BLUE = "#4a90e2";
const DARK_BLUE = "#1f4e79";
const GREEN = "#2ecc71";

export function RelatoriosChart({ data, nomeAluno, disciplina }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (!chartRef.current) return;
    
    try {
      setIsDownloading(true);
      const canvas = await html2canvas(chartRef.current, {
        scale: 2, // Retira o gráfico com maior resolução
        backgroundColor: "#ffffff",
      });
      
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Relatorio_${nomeAluno.replace(/[^a-z0-9]/gi, "_")}${disciplina ? `_${disciplina}` : ""}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
    } finally {
      setIsDownloading(false);
    }
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground text-sm">
          Nenhum dado de desempenho encontrado para este aluno.
        </p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.dateMs - b.dateMs);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Baixar Gráfico (PNG)
        </Button>
      </div>

      <div ref={chartRef} className="rounded-lg border bg-card p-4">
        <div className="mb-4 text-center">
          <p className="text-sm font-bold text-[#1f4e79]">
            APROVA+ • Diagnóstico Analítico 360°{" "}
            {disciplina ? `• ${disciplina}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">{nomeAluno}</p>
        </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={sorted}
          margin={{ top: 10, right: 24, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#555" }}
            label={{
              value: "Linha do Tempo",
              position: "insideBottom",
              offset: -4,
              fontSize: 11,
              fill: "#555",
            }}
          />
          <YAxis
            domain={[0, 110]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#555" }}
            label={{
              value: "Aproveitamento (%)",
              angle: -90,
              position: "insideLeft",
              offset: 12,
              fontSize: 11,
              fill: "#555",
            }}
          />
          <Tooltip
            formatter={(value, name) => [
              `${Number(value).toFixed(0)}%`,
              name,
            ]}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" />

          <Line
            type="monotone"
            dataKey="listas"
            name="Listas de Exercícios (Treino)"
            stroke={BLUE}
            strokeWidth={2}
            dot={{ r: 5, fill: BLUE }}
            activeDot={{ r: 7 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="provas"
            name="Provas da Escola (Resultado Oficial)"
            stroke={DARK_BLUE}
            strokeWidth={3}
            dot={{ r: 6, fill: DARK_BLUE }}
            activeDot={{ r: 8 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="engajamento"
            name="Índice de Engajamento e Foco"
            stroke={GREEN}
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={{ r: 4, fill: GREEN }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Linha amarela tracejada = meta mínima (70%)
      </p>
    </div>
    </div>
  );
}
