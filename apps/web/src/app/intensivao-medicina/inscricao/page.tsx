import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";
import { evento } from "@/lib/evento/config";
import { whatsappUrl } from "@/lib/teacher";
import { getEventoStatus } from "@/lib/evento/queries";
import { TrackPageView } from "../_components/track-page-view";
import { InscricaoForm } from "./inscricao-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscrição — Intensivão ENEM 2026 Medicina | Aprova+",
};

export default async function InscricaoPage() {
  const status = await getEventoStatus();

  return (
    <>
      <TrackPageView />

      <nav className="w-full bg-[#faf9f6] shadow-sm shadow-[#303330]/5">
        <div className="flex justify-between items-center px-6 py-4 max-w-3xl mx-auto w-full">
          <Link className="inline-flex" href="/">
            <BrandLockup
              priority
              labelClassName="font-headline text-2xl font-bold tracking-tight"
              logoClassName="h-9 w-9"
            />
          </Link>
          <Link
            href="/intensivao-medicina"
            className="text-primary font-bold text-sm underline"
          >
            Voltar para o Intensivão
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-on-surface">
            {evento.titulo}
          </h1>
          <p className="text-on-surface-variant">
            {evento.localNome} · {evento.localEndereco}
          </p>
        </div>

        {!status || !status.ativo ? (
          <div className="bg-surface-container-low rounded-3xl p-10 text-center space-y-4">
            <h2 className="text-2xl font-bold text-on-surface">
              Inscrições indisponíveis no momento
            </h2>
            <p className="text-on-surface-variant">
              Fale conosco pelo WhatsApp para mais informações.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-tertiary text-on-tertiary px-8 py-4 rounded-xl font-bold"
            >
              Falar no WhatsApp
            </a>
          </div>
        ) : status.esgotado ? (
          <div className="bg-surface-container-low rounded-3xl p-10 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-tertiary">
              event_busy
            </span>
            <h2 className="text-2xl font-bold text-on-surface">
              Vagas esgotadas!
            </h2>
            <p className="text-on-surface-variant">
              As 26 vagas do Intensivão ENEM 2026 — Foco Medicina já foram
              preenchidas. Entre na lista de espera para a próxima turma pelo
              WhatsApp.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-tertiary text-on-tertiary px-8 py-4 rounded-xl font-bold"
            >
              Entrar na Lista de Espera
            </a>
          </div>
        ) : (
          <InscricaoForm precoReais={status.precoCentavos / 100} />
        )}
      </main>
    </>
  );
}
