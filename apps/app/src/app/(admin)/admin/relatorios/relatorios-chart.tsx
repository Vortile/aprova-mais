"use client";

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
    <div className="rounded-lg border bg-card p-4">
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
  );
}
