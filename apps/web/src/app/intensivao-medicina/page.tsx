import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";
import { evento } from "@/lib/evento/config";
import { teacher, whatsappUrl } from "@/lib/teacher";
import { getEventoStatus } from "@/lib/evento/queries";
import { TrackPageView } from "./_components/track-page-view";
import { CtaLink } from "./_components/cta-link";
import { DualAudienceTabs } from "./_components/dual-audience-tabs";
import { FaqAccordion } from "./_components/faq-accordion";
import {
  FadeIn,
  FadeInWhenVisible,
  FloatingCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/motion-wrappers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Intensivão ENEM 2026 — Foco Medicina | Aprova+",
  description:
    "4 sábados presenciais em Manaus para destravar a nota de Medicina no ENEM 2026. Vagas limitadas a 26 alunos.",
};

const OFERTA_STACK = [
  {
    item: "4 Sábados de Imersão Presencial (8h de treinamento cirúrgico)",
    valor: 750,
  },
  {
    item: "Apostila física de questões comentadas & padrões recorrentes",
    valor: 197,
  },
  {
    item: "Mapas mentais dos tópicos mais importantes para Medicina",
    valor: 197,
  },
  {
    item: "Acesso ao grupo VIP no WhatsApp com o Prof. Júnior até o ENEM",
    valor: 297,
  },
] as const;

const VALOR_TOTAL = OFERTA_STACK.reduce((sum, row) => sum + row.valor, 0);

export default async function IntensivaoMedicinaPage() {
  const status = await getEventoStatus();

  const vagasRestantes = status?.vagasRestantes ?? evento.limiteTotalVagas;
  const esgotado = status?.esgotado ?? false;
  const turma1Esgotada = status?.turma1Esgotada ?? false;

  return (
    <>
      <TrackPageView />

      {/* ── Top Nav ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#faf9f6]/80 backdrop-blur-xl shadow-sm shadow-[#303330]/5">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full">
          <Link className="inline-flex" href="/">
            <BrandLockup
              priority
              labelClassName="font-headline text-2xl font-bold tracking-tight"
              logoClassName="h-9 w-9"
            />
          </Link>
          <CtaLink
            href="/intensivao-medicina/inscricao"
            className="cursor-pointer bg-tertiary hover:bg-blue-700 text-on-tertiary px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            {esgotado ? "Lista de Espera" : "Garantir Vaga"}
          </CtaLink>
        </div>
      </nav>

      <main className="pt-24 overflow-x-hidden">
        {/* ── Hero ── */}
        <section className="relative px-6 py-12 md:py-16 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <FadeIn className="md:col-span-7 text-center md:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container/30">
                <span className="material-symbols-outlined text-primary text-sm">
                  location_on
                </span>
                <span className="text-primary font-bold text-xs uppercase tracking-widest">
                  Manaus · AM · Presencial · 4 Sábados
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-surface leading-[1.1] tracking-tight">
                Destrave sua nota de{" "}
                <span className="text-primary italic">Medicina</span> no ENEM
                2026
              </h1>

              <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed">
                Um intensivão presencial de 4 sábados (12/09, 19/09, 26/09 e
                03/10) para quem já estuda muito, mas travou nos mesmos pontos
                da TRI. Em cada encontro, são 2h de aula com foco cirúrgico: 1h
                de Física com o Prof. Júnior e 1h de Matemática com o Prof.
                Convidado Juan Carlos Maia.
              </p>

              <div className="flex flex-col items-center md:items-start gap-3 pt-2">
                <CtaLink
                  href="/intensivao-medicina/inscricao"
                  className="bg-tertiary hover:bg-blue-700 cursor-pointer text-on-tertiary px-10 py-5 rounded-xl font-bold text-lg text-center hover:shadow-xl transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  {esgotado
                    ? "Entrar na Lista de Espera"
                    : "Garantir Minha Vaga — R$ 500"}
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </CtaLink>
                <p className="text-sm font-bold text-on-surface-variant">
                  {esgotado ? (
                    <span className="text-error">
                      Vagas esgotadas — as 26 vagas foram preenchidas
                    </span>
                  ) : vagasRestantes <= evento.limiarUrgenciaVagas ? (
                    <>
                      Restam apenas{" "}
                      <span className="text-tertiary">
                        {vagasRestantes} de {evento.limiteTotalVagas}
                      </span>{" "}
                      vagas
                      {turma1Esgotada
                        ? " — Primeira sala lotada, últimas vagas na segunda sala (mesmo horário)"
                        : ""}
                    </>
                  ) : (
                    "Vagas limitadas — turma pequena para manter o atendimento próximo ao aluno"
                  )}
                </p>
              </div>
            </FadeIn>

            {/* Featured Medical Study Image Card */}
            <FloatingCard className="md:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-surface-container-lowest">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/medicina-estudo.jpg"
                  alt="Material e estetoscópio de preparação para Medicina"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white text-left space-y-2">
                  <span className="px-3 py-1 bg-blue-600 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-white w-fit">
                    Foco Absoluto Medicina
                  </span>
                  <p className="font-headline font-bold text-lg leading-snug">
                    Preparação cirúrgica para a nota de corte mais concorrida
                  </p>
                </div>
              </div>
            </FloatingCard>
          </div>
        </section>

        {/* ── O Problema ── */}
        <section className="bg-surface-container-low py-20 px-6 rounded-t-[3.5rem]">
          <FadeInWhenVisible className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface">
                Por que 90% dos candidatos a Medicina travam na TRI?
              </h2>
              <p className="text-lg text-on-surface-variant leading-relaxed">
                Não é falta de esforço. É estudar teoria genérica quando a prova
                cobra um padrão bem específico de raciocínio. O Intensivão troca
                "estudar muito" por "estudar exatamente o que pesa" em Física e
                Matemática, com mapas mentais para revisar os pontos decisivos.
              </p>
            </div>

            {/* Team/Atmosphere photo card */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl max-w-3xl mx-auto border border-outline-variant/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/medicina-equipe.jpg"
                alt="Equipe de estudantes e futuros médicos"
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-950/30 to-transparent flex items-end p-6 md:p-8">
                <p className="text-white font-headline font-bold text-base md:text-xl">
                  Treinamento focado no padrão real de exigência dos aprovados
                  em Medicina na UFAM e UEA.
                </p>
              </div>
            </div>
          </FadeInWhenVisible>
        </section>

        {/* ── Cronograma ── */}
        <section className="py-20 px-6 max-w-5xl mx-auto" id="cronograma">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface text-center mb-12">
            O que acontece nos 4 sábados
          </h2>
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                dia: "Sábado 1 · 12/09",
                titulo: "Física + Matemática: base forte",
                desc: "1h de Física e 1h de Matemática para identificar lacunas e organizar o raciocínio que mais pontua.",
                icon: "science",
              },
              {
                dia: "Sábado 2 · 19/09",
                titulo: "Questões e velocidade",
                desc: "Física e Matemática aplicadas a questões do ENEM, com estratégias para interpretar e resolver melhor.",
                icon: "calculate",
              },
              {
                dia: "Sábado 3 · 26/09",
                titulo: "Padrões que se repetem",
                desc: "Mapas mentais e revisão dos padrões de Física e Matemática que mais aparecem na prova.",
                icon: "account_tree",
              },
              {
                dia: "Sábado 4 · 03/10",
                titulo: "Reta final de alto rendimento",
                desc: "Mais 1h de cada disciplina, consolidando métodos, atalhos e prioridades para a reta final do ENEM.",
                icon: "trending_up",
              },
            ].map((sabado) => (
              <StaggerItem
                key={sabado.dia}
                className="bg-surface-container-low p-8 rounded-3xl border-b-4 border-primary-container hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined text-3xl">
                    {sabado.icon}
                  </span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-tertiary mb-2">
                  {sabado.dia}
                </p>
                <h3 className="text-xl font-bold mb-3 text-on-surface">
                  {sabado.titulo}
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  {sabado.desc}
                </p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* ── Mentores ── */}
        <section className="bg-surface-container-lowest py-20 px-6 rounded-[3.5rem]">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-tertiary">
                Corpo Docente Especialista
              </p>
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface">
                Quem vai te guiar nos 4 sábados
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                Professores especialistas que unem rigor acadêmico, didática
                comprovada e foco cirúrgico na TRI e nos vestibulares de
                Medicina do Amazonas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Prof. Júnior */}
              <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col justify-between gap-6 hover:-translate-y-1 transition-all duration-300">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Professor ${teacher.fullName}`}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-md shrink-0"
                      src="/junior-professor-mestre.jpeg"
                    />
                    <div className="space-y-1">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary-container/40 text-primary text-[11px] font-bold uppercase tracking-wider">
                        Física · Fundador Aprova+
                      </span>
                      <h3 className="text-xl font-headline font-bold text-on-surface">
                        Prof. {teacher.fullName}
                      </h3>
                      <p className="text-xs text-on-surface-variant font-medium">
                        Bacharel e Mestre em Física · UFAM
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed text-center sm:text-left">
                    Mestre em Física da Matéria Condensada pela UFAM com
                    pesquisas publicadas internacionalmente na{" "}
                    <em>Nature Scientific Reports</em>. Especialista em
                    desconstruir a TRI de Ciências da Natureza, eliminando erros
                    recorrentes e acelerando a pontuação necessária para a nota
                    de corte de Medicina.
                  </p>
                </div>
              </div>

              {/* Prof. Convidado Juan Carlos */}
              <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col justify-between gap-6 hover:-translate-y-1 transition-all duration-300">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Professor Convidado Juan Carlos Ribeiro Maia"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-md shrink-0"
                      src="/juan-carlos-maia.jpg"
                    />
                    <div className="space-y-1">
                      <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider">
                        Professor Convidado · Matemática
                      </span>
                      <h3 className="text-xl font-headline font-bold text-on-surface">
                        Prof. Juan Carlos Maia
                      </h3>
                      <p className="text-xs text-on-surface-variant font-medium">
                        Graduando em Matemática · UEA
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed text-center sm:text-left">
                    Graduando em Matemática pela Universidade do Estado do
                    Amazonas (UEA) e educador do Projeto Ocupa (iniciativa de
                    preparação governamental para vestibulares). Com sólida
                    experiência no treinamento de alunos para a OBMEP, é
                    especialista em ensinar métodos ágeis de cálculo,
                    interpretação de enunciados e atalhos de raciocínio para
                    gabaritar a prova de Matemática do ENEM.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dupla Audiência ── */}
        <section className="py-20 px-6">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface text-center mb-12">
            Feito para quem decide e para quem estuda
          </h2>
          <DualAudienceTabs />
        </section>

        {/* ── Oferta / Ancoragem ── */}
        <section
          className="bg-surface-container-low py-20 px-6 rounded-[3.5rem]"
          id="oferta"
        >
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface">
              Tudo isso por uma fração do valor real
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              Uma faculdade particular de Medicina custa entre R$ 9 e 14 mil por
              mês. Um ano a mais de cursinho tradicional em Manaus custa cerca
              de R$ 15.000. O Intensivão custa uma fração disso.
            </p>
          </div>

          <div className="max-w-2xl mx-auto bg-surface rounded-3xl p-8 md:p-10 space-y-4">
            {OFERTA_STACK.map((row) => (
              <div
                key={row.item}
                className="flex items-center justify-between gap-4"
              >
                <span className="text-on-surface-variant">{row.item}</span>
                <span className="font-bold text-on-surface shrink-0">
                  R$ {row.valor}
                </span>
              </div>
            ))}
            <div className="pt-4 flex items-center justify-between">
              <span className="font-bold text-on-surface">
                Valor total real
              </span>
              <span className="font-bold text-on-surface-variant line-through">
                R$ {VALOR_TOTAL}
              </span>
            </div>
            <div className="flex items-center justify-between bg-tertiary-container/30 -mx-8 -mb-8 mt-4 px-8 py-6 rounded-b-3xl">
              <span className="font-bold text-lg text-on-surface">
                Seu investimento hoje
              </span>
              <span className="font-black text-3xl text-tertiary">
                R$ {evento.precoReais}
              </span>
            </div>
          </div>

          <div className="text-center mt-10">
            <CtaLink
              href="/intensivao-medicina/inscricao"
              className="bg-tertiary hover:bg-blue-700 cursor-pointer text-on-tertiary px-10 py-5 rounded-xl font-bold text-lg text-center hover:shadow-xl transition-all active:scale-95 inline-flex items-center gap-2"
            >
              {esgotado
                ? "Entrar na Lista de Espera"
                : "Garantir Minha Vaga Agora"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </CtaLink>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 px-6" id="faq">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface text-center mb-12">
            Perguntas frequentes
          </h2>
          <FaqAccordion />
        </section>

        {/* ── Local / Contato ── */}
        <section className="bg-surface-container-low py-16 px-6 rounded-t-[3.5rem]">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <h2 className="text-2xl font-headline font-bold text-on-surface">
              {evento.localNome}
            </h2>
            <p className="text-on-surface-variant">{evento.localEndereco}</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-primary font-bold underline"
            >
              Dúvidas? Fale conosco: {evento.localContato}
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
