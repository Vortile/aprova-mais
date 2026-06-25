"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  LabelList,
} from "recharts";

export type ChartDataPoint = {
  /** DD/MM */
  date: string;
  /** Milliseconds epoch — used for sort only */
  dateMs: number;
  listas?: number | null;
  provas?: number | null;
  engajamento?: number | null;
  listasPorDisciplina?: Record<string, number>;
  provasPorDisciplina?: Record<string, number>;
};

interface Props {
  data: ChartDataPoint[];
  nomeAluno: string;
  disciplina?: string;
}

const BLUE = "#4a90e2";
const DARK_BLUE = "#1f4e79";
const GREEN = "#2ecc71";

function cleanCssText(css: string): string {
  if (!css) return css;

  // Replace oklch(...) with hsl(...)
  css = css.replace(
    /oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/gi,
    (m, lVal, cVal, hVal, aVal) => {
      try {
        let l = parseFloat(lVal);
        if (lVal.includes("%")) l = l / 100;
        let c = parseFloat(cVal);
        if (cVal.includes("%")) c = c / 100;
        let h = parseFloat(hVal);
        if (hVal.includes("deg")) h = parseFloat(hVal.replace("deg", ""));
        else if (hVal.includes("rad"))
          h = parseFloat(hVal.replace("rad", "")) * (180 / Math.PI);
        else if (hVal.includes("grad"))
          h = parseFloat(hVal.replace("grad", "")) * 0.9;
        else if (hVal.includes("turn"))
          h = parseFloat(hVal.replace("turn", "")) * 360;
        if (isNaN(h)) h = 0;

        let s = Math.max(0, Math.min(100, c * 250));
        let lPercent = (Math.max(0, Math.min(1, l)) * 100).toFixed(1) + "%";
        let sPercent = s.toFixed(1) + "%";
        let hDeg = h.toFixed(1);

        if (aVal !== undefined) {
          let a = parseFloat(aVal);
          if (aVal.includes("%")) a = a / 100;
          return `hsla(${hDeg}, ${sPercent}, ${lPercent}, ${a})`;
        }
        return `hsl(${hDeg}, ${sPercent}, ${lPercent})`;
      } catch (err) {
        return "#ffffff";
      }
    },
  );

  // Replace lab(...) with hsl(0, 0%, L%)
  css = css.replace(
    /lab\(\s*([\d.%]+)\s+([-\d.%]+)\s+([-\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/gi,
    (m, lVal, aValSub, bValSub, aVal) => {
      try {
        let l = parseFloat(lVal);
        if (!lVal.includes("%")) l = Math.min(100, l); // lab L is usually 0-100
        let lPercent = l.toFixed(1) + "%";
        if (aVal !== undefined) {
          let a = parseFloat(aVal);
          if (aVal.includes("%")) a = a / 100;
          return `hsla(0, 0%, ${lPercent}, ${a})`;
        }
        return `hsl(0, 0%, ${lPercent})`;
      } catch (err) {
        return "#ffffff";
      }
    },
  );

  return css;
}

export function RelatoriosChart({ data, nomeAluno, disciplina }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showListas, setShowListas] = useState(true);
  const [showProvas, setShowProvas] = useState(true);
  const [showEngajamento, setShowEngajamento] = useState(true);

  async function handleDownload() {
    if (!chartRef.current) return;

    const originalGetComputedStyle = window.getComputedStyle;

    try {
      setIsDownloading(true);
      const originalWidth = chartRef.current.offsetWidth;

      // Patch the host window's getComputedStyle to intercept oklch() and lab() color values
      window.getComputedStyle = function (elt, pseudoElt) {
        const style = originalGetComputedStyle.call(window, elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === "getPropertyValue") {
              return function (key: string) {
                const val = target.getPropertyValue(key);
                return cleanCssText(val);
              };
            }

            const val = target[prop as any];
            if (typeof val === "string") {
              return cleanCssText(val);
            }

            if (typeof val === "function") {
              return (val as any).bind(target);
            }
            return val;
          },
        });
      };

      const canvas = await html2canvas(chartRef.current, {
        scale: 2, // Retira o gráfico com maior resolução
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // 1. Force the original width of the container in the cloned document
          const clonedContainer = clonedDoc.getElementById(
            "relatorios-chart-container",
          );
          if (clonedContainer) {
            (clonedContainer as HTMLElement).style.width = `${originalWidth}px`;
            (clonedContainer as HTMLElement).style.boxSizing = "border-box";
            (clonedContainer as HTMLElement).style.padding = "24px";
            (clonedContainer as HTMLElement).style.borderRadius = "12px";
            (clonedContainer as HTMLElement).style.border = "1px solid #e2e8f0";
            (clonedContainer as HTMLElement).style.backgroundColor = "#ffffff";
            (clonedContainer as HTMLElement).style.fontFamily =
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
          }

          // 2. Also patch the cloned window's getComputedStyle just in case html2canvas uses it
          if (clonedDoc.defaultView) {
            const clonedOriginalGetComputedStyle =
              clonedDoc.defaultView.getComputedStyle;
            clonedDoc.defaultView.getComputedStyle = function (elt, pseudoElt) {
              const style = clonedOriginalGetComputedStyle.call(
                clonedDoc.defaultView,
                elt,
                pseudoElt,
              );
              return new Proxy(style, {
                get(target, prop) {
                  if (prop === "getPropertyValue") {
                    return function (key: string) {
                      const val = target.getPropertyValue(key);
                      return cleanCssText(val);
                    };
                  }

                  const val = target[prop as any];
                  if (typeof val === "string") {
                    return cleanCssText(val);
                  }

                  if (typeof val === "function") {
                    return (val as any).bind(target);
                  }
                  return val;
                },
              });
            };
          }

          // 3. Define safe fallback CSS variables on document element and body in cloned doc
          const root = clonedDoc.documentElement;
          if (root) {
            root.style.setProperty("--background", "#ffffff");
            root.style.setProperty("--foreground", "#020817");
            root.style.setProperty("--card", "#ffffff");
            root.style.setProperty("--card-foreground", "#020817");
            root.style.setProperty("--popover", "#ffffff");
            root.style.setProperty("--popover-foreground", "#020817");
            root.style.setProperty("--primary", "#1f4e79");
            root.style.setProperty("--primary-foreground", "#ffffff");
            root.style.setProperty("--secondary", "#f1f5f9");
            root.style.setProperty("--secondary-foreground", "#1f4e79");
            root.style.setProperty("--muted", "#f1f5f9");
            root.style.setProperty("--muted-foreground", "#64748b");
            root.style.setProperty("--accent", "#f1f5f9");
            root.style.setProperty("--accent-foreground", "#1f4e79");
            root.style.setProperty("--border", "#e2e8f0");
            root.style.setProperty("--input", "#e2e8f0");
            root.style.setProperty("--ring", "#1f4e79");
            root.style.fontFamily =
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
          }

          const body = clonedDoc.body;
          if (body) {
            body.style.fontFamily =
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
          }

          // 4. Strip all oklch() and lab() color functions from cloned inline styles and stylesheets
          const styles = clonedDoc.querySelectorAll("style");
          styles.forEach((style) => {
            try {
              style.innerHTML = cleanCssText(style.innerHTML);
            } catch (e) {
              console.error("Error cleaning inline style:", e);
            }
          });

          // 5. Clean external stylesheets and convert them to inline cleaned styles, disabling old ones
          try {
            const head =
              clonedDoc.head || clonedDoc.getElementsByTagName("head")[0];
            const sheets = Array.from(clonedDoc.styleSheets);
            sheets.forEach((sheet: any) => {
              try {
                const rules = sheet.cssRules || sheet.rules;
                if (!rules) return;
                let cssText = "";
                for (let i = 0; i < rules.length; i++) {
                  cssText += rules[i].cssText + "\n";
                }
                const cleanedCss = cleanCssText(cssText);
                const styleTag = clonedDoc.createElement("style");
                styleTag.innerHTML = cleanedCss;
                if (head) {
                  head.appendChild(styleTag);
                }
                // Remove/disable original sheet
                if (sheet.ownerNode && sheet.ownerNode.parentNode) {
                  sheet.ownerNode.parentNode.removeChild(sheet.ownerNode);
                }
              } catch (sheetError) {
                // Ignore CORS styleSheet access errors
              }
            });
          } catch (e) {
            console.error("Error cleaning stylesheets:", e);
          }
        },
      });

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Relatorio_${nomeAluno.replace(/[^a-z0-9]/gi, "_")}${disciplina ? `_${disciplina}` : ""}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
    } finally {
      // Restore the original getComputedStyle to the host window
      window.getComputedStyle = originalGetComputedStyle;
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

  // Custom label renderer to handle overlapping values elegantly
  const renderCustomLabel = (
    key: "listas" | "provas" | "engajamento",
    color: string,
  ) => {
    return (props: any) => {
      const { x, y, value, index } = props;
      if (value === null || value === undefined) return null;

      const point = sorted[index];
      if (!point) return null;

      let dx = 0;
      let dy = 0;
      let anchor: "start" | "middle" | "end" = "middle";

      // Default positioning
      if (key === "engajamento") {
        dy = 14; // default bottom
      } else {
        dy = -10; // default top
      }

      // Check for collisions at this index
      const valListas = showListas ? point.listas : null;
      const valProvas = showProvas ? point.provas : null;

      // Case 1: Listas and Provas collide on the same value (and are both shown)
      if (
        key === "listas" &&
        valListas !== null &&
        valProvas !== null &&
        valListas === valProvas
      ) {
        dx = -12;
        dy = -4;
        anchor = "end";
      } else if (
        key === "provas" &&
        valListas !== null &&
        valProvas !== null &&
        valListas === valProvas
      ) {
        dx = 12;
        dy = -4;
        anchor = "start";
      }

      return (
        <text
          x={Number(x) + dx}
          y={Number(y) + dy}
          fill={color}
          fontSize={10}
          fontWeight="600"
          textAnchor={anchor}
        >
          {value}%
        </text>
      );
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Metric toggles */}
        <div className="flex flex-wrap items-center gap-5 text-xs bg-muted/40 px-3 py-1.5 rounded-lg border">
          <span className="font-semibold text-slate-700">
            Mostrar no gráfico:
          </span>

          <div className="flex items-center gap-2">
            <Checkbox
              id="toggle-listas"
              checked={showListas}
              onCheckedChange={(checked) => setShowListas(!!checked)}
            />
            <Label
              htmlFor="toggle-listas"
              className="flex items-center gap-1.5 cursor-pointer text-xs font-medium"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: BLUE }}
              />
              Listas (Treino)
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="toggle-provas"
              checked={showProvas}
              onCheckedChange={(checked) => setShowProvas(!!checked)}
            />
            <Label
              htmlFor="toggle-provas"
              className="flex items-center gap-1.5 cursor-pointer text-xs font-medium"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: DARK_BLUE }}
              />
              Provas (Oficial)
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="toggle-engajamento"
              checked={showEngajamento}
              onCheckedChange={(checked) => setShowEngajamento(!!checked)}
            />
            <Label
              htmlFor="toggle-engajamento"
              className="flex items-center gap-1.5 cursor-pointer text-xs font-medium"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: GREEN }}
              />
              Engajamento e Foco
            </Label>
          </div>
        </div>

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

      <div
        ref={chartRef}
        id="relatorios-chart-container"
        className="rounded-lg border bg-card p-4"
      >
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

            {showProvas && (
              <Line
                type="monotone"
                dataKey="provas"
                name="Provas da Escola (Resultado Oficial)"
                stroke={DARK_BLUE}
                strokeWidth={3}
                dot={{ r: 7, fill: DARK_BLUE }}
                activeDot={{ r: 9 }}
                connectNulls={true}
              >
                <LabelList
                  dataKey="provas"
                  content={renderCustomLabel("provas", DARK_BLUE)}
                />
              </Line>
            )}
            {showListas && (
              <Line
                type="monotone"
                dataKey="listas"
                name="Listas de Exercícios (Treino)"
                stroke={BLUE}
                strokeWidth={2}
                dot={{ r: 5, fill: "#ffffff", stroke: BLUE, strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                connectNulls={true}
              >
                <LabelList
                  dataKey="listas"
                  content={renderCustomLabel("listas", BLUE)}
                />
              </Line>
            )}
            {showEngajamento && (
              <Line
                type="monotone"
                dataKey="engajamento"
                name="Índice de Engajamento e Foco"
                stroke={GREEN}
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={{ r: 4, fill: GREEN }}
                connectNulls={true}
              >
                <LabelList
                  dataKey="engajamento"
                  content={renderCustomLabel("engajamento", GREEN)}
                />
              </Line>
            )}
          </LineChart>
        </ResponsiveContainer>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Linha amarela tracejada = meta mínima (70%)
        </p>
      </div>
    </div>
  );
}
