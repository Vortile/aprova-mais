"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { evento, serieOptions } from "@/lib/evento/config";
import {
  calculateAge,
  formatCPF,
  formatWhatsapp,
  onlyDigits,
} from "@/lib/evento/format";
import { inscricaoSchema } from "@/lib/validations/inscricao";
import { getEventoSessionId } from "@/lib/evento/session";
import { captureAndGetUtmParams } from "@/lib/evento/utm";
import {
  consultarStatusInscricaoAction,
  criarInscricaoAction,
  trackEventoAction,
} from "@/lib/actions/inscricao";
import { PaymentBrick, type PixResult } from "./payment-brick";

type Step = "form" | "pagamento" | "confirmado";

type FormState = {
  nomeAluno: string;
  emailAluno: string;
  whatsappAluno: string;
  cpfAluno: string;
  dataNascimento: string;
  serieAtual: (typeof serieOptions)[number]["value"] | "";
  nomeResponsavel: string;
  whatsappResponsavel: string;
  restricoesMedicas: string;
};

const initialFormState: FormState = {
  nomeAluno: "",
  emailAluno: "",
  whatsappAluno: "",
  cpfAluno: "",
  dataNascimento: "",
  serieAtual: "",
  nomeResponsavel: "",
  whatsappResponsavel: "",
  restricoesMedicas: "",
};

const inputClassName =
  "w-full bg-surface-container rounded-xl px-4 py-3.5 text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-colors";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-bold text-on-surface">{label}</span>
      {children}
      {error && (
        <span className="block text-xs text-error font-medium">{error}</span>
      )}
    </label>
  );
}

export function InscricaoForm({ precoReais }: { precoReais: number }) {
  const sessionId = useMemo(() => getEventoSessionId(), []);
  const formStartedRef = useRef(false);

  const [step, setStep] = useState<Step>("form");
  const [values, setValues] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [inscricaoId, setInscricaoId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixResult | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [confirmacao, setConfirmacao] = useState<{
    turmaAlocada: 1 | 2 | null;
    horarioTurma: string | null;
    codigoIngresso: string;
  } | null>(null);

  const age = values.dataNascimento
    ? calculateAge(values.dataNascimento)
    : null;
  const isMinor = age !== null && age < 18;

  function markFormStarted() {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackEventoAction({ sessionId, tipoEvento: "form_started" }).catch(
      () => {},
    );
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    markFormStarted();
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const utm = captureAndGetUtmParams();
    const parsed = inscricaoSchema.safeParse({
      ...values,
      serieAtual: values.serieAtual || undefined,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setFormError("Verifique os campos destacados abaixo.");
      return;
    }

    setErrors({});
    setSubmitting(true);
    trackEventoAction({
      sessionId,
      tipoEvento: "form_submitted",
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
    }).catch(() => {});

    const result = await criarInscricaoAction(parsed.data, sessionId);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setInscricaoId(result.inscricaoId);
    setStep("pagamento");
  }

  function handlePixGenerated(pix: PixResult) {
    setPixData(pix);
    trackEventoAction({
      sessionId,
      tipoEvento: "pix_generated",
      inscricaoId: inscricaoId ?? undefined,
    }).catch(() => {});
  }

  async function handleCopyPix() {
    if (!pixData) return;
    await navigator.clipboard.writeText(pixData.qrCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }

  async function handleCardApproved() {
    if (!inscricaoId) return;
    const result = await consultarStatusInscricaoAction(inscricaoId);
    if (result.ok) {
      setConfirmacao({
        turmaAlocada: result.turmaAlocada,
        horarioTurma: result.horarioTurma,
        codigoIngresso: result.codigoIngresso,
      });
    }
    setStep("confirmado");
  }

  useEffect(() => {
    if (step !== "pagamento" || !pixData || !inscricaoId) {
      return;
    }

    const interval = setInterval(async () => {
      const result = await consultarStatusInscricaoAction(inscricaoId);
      if (result.ok && result.statusPagamento === "aprovado") {
        clearInterval(interval);
        setConfirmacao({
          turmaAlocada: result.turmaAlocada,
          horarioTurma: result.horarioTurma,
          codigoIngresso: result.codigoIngresso,
        });
        setStep("confirmado");
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [step, pixData, inscricaoId]);

  if (step === "confirmado") {
    return (
      <div className="bg-surface-container-low rounded-3xl p-10 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-primary">
          check_circle
        </span>
        <h2 className="text-2xl font-bold text-on-surface">
          Pagamento confirmado! Vaga garantida 🎉
        </h2>
        {confirmacao?.turmaAlocada && (
          <p className="text-on-surface-variant text-lg">
            Você ficou na <strong>Turma {confirmacao.turmaAlocada}</strong> (
            {confirmacao.horarioTurma})
          </p>
        )}
        <p className="text-on-surface-variant">
          Enviamos o seu ingresso com QR Code para o e-mail informado. Verifique
          também a caixa de spam.
        </p>
      </div>
    );
  }

  if (step === "pagamento" && inscricaoId) {
    return (
      <div className="bg-surface-container-low rounded-3xl p-8 md:p-10 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-sm font-bold uppercase tracking-widest text-tertiary">
            Passo 2 de 2
          </p>
          <h2 className="text-2xl font-bold text-on-surface">
            Pagamento — R$ {precoReais.toFixed(2).replace(".", ",")}
          </h2>
        </div>

        {!pixData && (
          <PaymentBrick
            inscricaoId={inscricaoId}
            amount={precoReais}
            payerEmail={values.emailAluno}
            payerCpf={onlyDigits(values.cpfAluno)}
            onPixGenerated={handlePixGenerated}
            onCardApproved={handleCardApproved}
            onError={(message) => setPaymentError(message)}
          />
        )}

        {pixData && (
          <div className="text-center space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${pixData.qrCodeBase64}`}
              alt="QR Code do PIX"
              className="mx-auto w-56 h-56 rounded-2xl bg-white p-2"
            />
            <button
              onClick={handleCopyPix}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold cursor-pointer"
            >
              {copySuccess ? "Copiado!" : "Copiar código Pix Copia e Cola"}
            </button>
            <p className="text-sm text-on-surface-variant">
              Aguardando confirmação do pagamento...
            </p>
          </div>
        )}

        {paymentError && (
          <p className="text-center text-error font-medium">{paymentError}</p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-low rounded-3xl p-8 md:p-10 space-y-5"
    >
      <p className="text-sm font-bold uppercase tracking-widest text-tertiary text-center">
        Passo 1 de 2 — Dados do Aluno
      </p>

      <Field label="Nome completo" error={errors.nomeAluno}>
        <input
          className={inputClassName}
          value={values.nomeAluno}
          onChange={(e) => updateField("nomeAluno", e.target.value)}
          placeholder="Nome completo do aluno"
        />
      </Field>

      <Field label="E-mail" error={errors.emailAluno}>
        <input
          type="email"
          className={inputClassName}
          value={values.emailAluno}
          onChange={(e) => updateField("emailAluno", e.target.value)}
          placeholder="seu@email.com"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="WhatsApp com DDD" error={errors.whatsappAluno}>
          <input
            className={inputClassName}
            value={values.whatsappAluno}
            onChange={(e) =>
              updateField("whatsappAluno", formatWhatsapp(e.target.value))
            }
            placeholder="(92) 9 9999-9999"
          />
        </Field>

        <Field label="CPF" error={errors.cpfAluno}>
          <input
            className={inputClassName}
            value={values.cpfAluno}
            onChange={(e) => updateField("cpfAluno", formatCPF(e.target.value))}
            placeholder="000.000.000-00"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Data de nascimento" error={errors.dataNascimento}>
          <input
            type="date"
            className={inputClassName}
            value={values.dataNascimento}
            onChange={(e) => updateField("dataNascimento", e.target.value)}
          />
        </Field>

        <Field label="Série atual" error={errors.serieAtual}>
          <select
            className={inputClassName}
            value={values.serieAtual}
            onChange={(e) =>
              updateField(
                "serieAtual",
                e.target.value as FormState["serieAtual"],
              )
            }
          >
            <option value="">Selecione...</option>
            {serieOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {isMinor && (
        <div className="grid sm:grid-cols-2 gap-5 bg-secondary-container/30 p-5 rounded-2xl">
          <Field label="Nome do responsável" error={errors.nomeResponsavel}>
            <input
              className={inputClassName}
              value={values.nomeResponsavel}
              onChange={(e) => updateField("nomeResponsavel", e.target.value)}
              placeholder="Nome do responsável"
            />
          </Field>
          <Field
            label="WhatsApp do responsável"
            error={errors.whatsappResponsavel}
          >
            <input
              className={inputClassName}
              value={values.whatsappResponsavel}
              onChange={(e) =>
                updateField(
                  "whatsappResponsavel",
                  formatWhatsapp(e.target.value),
                )
              }
              placeholder="(92) 9 9999-9999"
            />
          </Field>
        </div>
      )}

      <Field label="Restrições alimentares ou médicas (opcional)">
        <textarea
          className={inputClassName}
          value={values.restricoesMedicas}
          onChange={(e) => updateField("restricoesMedicas", e.target.value)}
          rows={2}
          placeholder="Alergias, diabetes, etc. (informação opcional)"
        />
      </Field>

      {formError && (
        <p className="text-center text-error font-medium">{formError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-tertiary hover:bg-blue-700 text-on-tertiary px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
      >
        {submitting
          ? "Enviando..."
          : `Continuar para o pagamento — R$ ${evento.precoReais}`}
      </button>
    </form>
  );
}
