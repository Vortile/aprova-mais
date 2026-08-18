"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Copy,
  Laptop,
  Mail,
  QrCode,
  Send,
  Smartphone,
  Code,
} from "lucide-react";
import { generateTicketEmailHtml } from "@/lib/email/ticket-template";
import {
  generateDripEmailHtml,
  DRIP_EMAIL_LABELS,
  type DripEmailType,
} from "@/lib/email/drip-templates";
import { evento as eventoConfig } from "@/lib/evento/config";
import { enviarPreviewEmailAction } from "@/lib/actions/eventos";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@repo/db";

type EmailTab = "ticket" | DripEmailType;
type InscricaoRow = Database["public"]["Tables"]["evento_inscricoes"]["Row"];

export function PreviewEmailsAdminClient() {
  const [activeTab, setActiveTab] = useState<EmailTab>("ticket");
  const [device, setDevice] = useState<"desktop" | "mobile" | "code">(
    "desktop",
  );
  const [nomeAluno, setNomeAluno] = useState("Lucas Fernandes de Souza");
  const [turma, setTurma] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [targetEmail, setTargetEmail] = useState(
    "lucianosimonipersonal@gmail.com",
  );
  const [apiKeyOverride, setApiKeyOverride] = useState("");
  const [sendingState, setSendingState] = useState<{
    loading: boolean;
    success?: string;
    error?: string;
  }>({ loading: false });

  useEffect(() => {
    QRCode.toDataURL("APROVA-MED-TESTE-2026", {
      width: 240,
      margin: 1,
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code error:", err));
  }, []);

  const mockInscricao: InscricaoRow = useMemo(
    () => ({
      id: "insc-mock-admin-uuid",
      evento_id: "evt-mock-admin-uuid",
      numero_inscricao: 1,
      session_id: "sess-123",
      nome_aluno: nomeAluno,
      email_aluno: targetEmail,
      whatsapp_aluno: "92981112233",
      cpf_aluno: "00011122233",
      data_nascimento: "2007-03-15",
      idade_aluno: 18,
      serie_atual: "3_ano",
      nome_responsavel: null,
      whatsapp_responsavel: null,
      restricoes_medicas: null,
      status_pagamento: "aprovado",
      forma_pagamento: "pix",
      gateway: "mercadopago",
      gateway_payment_id: "mp-123456789",
      numero_confirmacao: turma === 1 ? 7 : 19,
      turma_alocada: turma,
      horario_turma:
        turma === 1 ? eventoConfig.horarioTurma1 : eventoConfig.horarioTurma2,
      sala_alocada:
        turma === 1 ? eventoConfig.salaTurma1 : eventoConfig.salaTurma2,
      codigo_ingresso: "APROVA-MED-98765432",
      valor_pago_centavos: 50000,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      created_at: new Date().toISOString(),
      pago_em: new Date().toISOString(),
    }),
    [nomeAluno, turma, targetEmail],
  );

  const emailData = useMemo(() => {
    if (activeTab === "ticket") {
      let rawHtml = generateTicketEmailHtml({
        inscricao: mockInscricao,
        evento: {
          data_sabado_1: "2026-09-12",
          data_sabado_2: "2026-09-19",
          data_sabado_3: "2026-09-26",
          data_sabado_4: "2026-10-03",
        },
      });

      if (qrDataUrl) {
        rawHtml = rawHtml.replace("cid:ticket-qrcode", qrDataUrl);
      }

      return {
        title: "🎟️ Ingresso com QR Code",
        subject: `🎟️ Seu Ingresso — ${eventoConfig.titulo}`,
        trigger: "Imediato — disparado no momento da confirmação do PIX/Cartão",
        badge: "Transacional Crítico",
        badgeVariant: "default" as const,
        html: rawHtml,
      };
    }

    const dripInfo = generateDripEmailHtml({
      tipo: activeTab,
      nomeAluno,
      turma,
      horario:
        turma === 1 ? eventoConfig.horarioTurma1 : eventoConfig.horarioTurma2,
      sala: turma === 1 ? eventoConfig.salaTurma1 : eventoConfig.salaTurma2,
    });

    const meta = DRIP_EMAIL_LABELS[activeTab];

    return {
      title: meta.title,
      subject: dripInfo.subject,
      trigger: meta.trigger,
      badge: "Régua Drip Automatizada",
      badgeVariant: "secondary" as const,
      html: dripInfo.html,
    };
  }, [activeTab, mockInscricao, nomeAluno, turma, qrDataUrl]);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(emailData.html);
    setCopied(true);
    toast.success("HTML copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async (typeToSend: "current" | "all") => {
    setSendingState({ loading: true });
    try {
      const res = await enviarPreviewEmailAction({
        to: targetEmail,
        emailType: typeToSend === "all" ? "all" : activeTab,
        apiKeyOverride: apiKeyOverride || undefined,
        nomeAluno,
        turma,
      });

      if (!res.ok) {
        setSendingState({ loading: false, error: res.error });
        toast.error(res.error);
      } else {
        setSendingState({
          loading: false,
          success: res.message,
        });
        toast.success(res.message);
        setTimeout(() => setSendingState({ loading: false }), 6000);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro na requisição de envio.";
      setSendingState({ loading: false, error: msg });
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb / Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.ADMIN.EVENTOS}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Voltar aos Eventos
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Visualizador de E-mails
            </h1>
            <p className="text-xs text-muted-foreground">
              Intensivão ENEM Medicina 2026 — Área protegida do Administrador
            </p>
          </div>
        </div>

        {/* View mode & Copy HTML */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border rounded-lg p-1 bg-muted/40">
            <Button
              size="sm"
              variant={device === "desktop" ? "default" : "ghost"}
              className="h-8 text-xs"
              onClick={() => setDevice("desktop")}
            >
              <Laptop className="w-3.5 h-3.5 mr-1.5" />
              Desktop (600px)
            </Button>
            <Button
              size="sm"
              variant={device === "mobile" ? "default" : "ghost"}
              className="h-8 text-xs"
              onClick={() => setDevice("mobile")}
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5" />
              Mobile (375px)
            </Button>
            <Button
              size="sm"
              variant={device === "code" ? "default" : "ghost"}
              className="h-8 text-xs"
              onClick={() => setDevice("code")}
            >
              <Code className="w-3.5 h-3.5 mr-1.5" />
              HTML
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={handleCopyHtml}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar HTML
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Controls & Email List (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Simulation Box */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Simulador de Aluno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Nome do Aluno
                </label>
                <Input
                  value={nomeAluno}
                  onChange={(e) => setNomeAluno(e.target.value)}
                  placeholder="Nome do aluno"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Turma Alocada
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={turma === 1 ? "default" : "outline"}
                    className="h-8 text-xs font-semibold"
                    onClick={() => setTurma(1)}
                  >
                    Turma 1 (08h-10h)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={turma === 2 ? "default" : "outline"}
                    className="h-8 text-xs font-semibold"
                    onClick={() => setTurma(2)}
                  >
                    Turma 2 (10h-12h)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real Dispatcher Box */}
          <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Disparar Teste Real (Resend)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  E-mail de Destino
                </label>
                <Input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Chave Resend (opcional / re_...)
                </label>
                <Input
                  type="password"
                  value={apiKeyOverride}
                  onChange={(e) => setApiKeyOverride(e.target.value)}
                  placeholder="Usa a do .env se vazio"
                  className="h-8 text-xs font-mono bg-background"
                />
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <Button
                  size="sm"
                  disabled={sendingState.loading}
                  onClick={() => handleSendEmail("current")}
                  className="w-full text-xs font-bold"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  {sendingState.loading ? "Enviando..." : "Enviar Este E-mail"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={sendingState.loading}
                  onClick={() => handleSendEmail("all")}
                  className="w-full text-xs font-bold"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {sendingState.loading
                    ? "Enviando fila..."
                    : "Enviar Todos os 9 E-mails"}
                </Button>
              </div>

              {sendingState.success && (
                <p className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 p-2 rounded border border-green-200 dark:border-green-800">
                  {sendingState.success}
                </p>
              )}
              {sendingState.error && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-800">
                  {sendingState.error}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Email Selection List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Ingresso Transacional
            </h4>
            <button
              type="button"
              onClick={() => setActiveTab("ticket")}
              className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                activeTab === "ticket"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card hover:bg-muted border-border"
              }`}
            >
              <div className="flex items-center justify-between font-bold text-sm mb-1">
                <span>🎟️ Ingresso com QR Code</span>
                <Badge
                  variant={activeTab === "ticket" ? "secondary" : "default"}
                  className="text-[10px]"
                >
                  D-0
                </Badge>
              </div>
              <p
                className={`text-[11px] leading-snug ${
                  activeTab === "ticket"
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                }`}
              >
                QR Code, sala ({turma === 1 ? "Sala HY" : "Sala HY"}) e horário
                da Turma {turma}.
              </p>
            </button>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Régua Drip de Nutrição
            </h4>
            {(Object.keys(DRIP_EMAIL_LABELS) as DripEmailType[]).map((key) => {
              const item = DRIP_EMAIL_LABELS[key];
              const isSelected = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card hover:bg-muted border-border"
                  }`}
                >
                  <div className="font-bold text-sm mb-1">{item.title}</div>
                  <p
                    className={`text-[11px] leading-snug ${
                      isSelected
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.trigger}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Main Viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Metadata Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={emailData.badgeVariant}>
                    {emailData.badge}
                  </Badge>
                  <h3 className="font-bold text-base">{emailData.title}</h3>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {emailData.trigger}
                </span>
              </div>
            </CardHeader>
            <CardContent className="text-xs space-y-1.5 border-t pt-3 text-muted-foreground">
              <div>
                <strong className="text-foreground">Assunto:</strong>{" "}
                {emailData.subject}
              </div>
              <div>
                <strong className="text-foreground">Remetente:</strong> Aprova+
                Eventos &lt;contato@aprovamaiscurso-pro.com.br&gt;
              </div>
              <div>
                <strong className="text-foreground">Destinatário:</strong>{" "}
                {mockInscricao.email_aluno}
              </div>
            </CardContent>
          </Card>

          {/* Render Area */}
          {device === "code" ? (
            <Card className="p-4 bg-muted/40 font-mono text-xs overflow-x-auto max-h-[750px]">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {emailData.html}
              </pre>
            </Card>
          ) : (
            <div className="flex justify-center p-4 bg-muted/30 rounded-2xl border">
              <div
                className={`transition-all duration-300 rounded-xl overflow-hidden shadow-xl border bg-white ${
                  device === "mobile" ? "w-[395px]" : "w-full max-w-[620px]"
                }`}
              >
                <iframe
                  title="Preview do E-mail"
                  srcDoc={emailData.html}
                  className="w-full h-[750px] border-0"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
