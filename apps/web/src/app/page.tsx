import { MobileNav } from "@/components/mobile-nav";
import { BrandLockup } from "@/components/brand-lockup";
import { teacher, whatsappUrl, instagramUrl } from "@/lib/teacher";
import { getEventoStatus } from "@/lib/evento/queries";
import { EventoPromoBanner } from "@/app/_components/evento-promo-banner";
import { EventoPromoSection } from "@/app/_components/evento-promo-section";
import { FadeIn, FloatingCard } from "@/components/motion/motion-wrappers";
import Image from "next/image";

const { zcalUrl, portalUrl } = teacher;

export const dynamic = "force-dynamic";

export default async function WebHomePage() {
  const eventoStatus = await getEventoStatus();
  const promoAtivo = eventoStatus?.promoAtivo ?? false;

  return (
    <>
      {/* ── Top Nav ── */}
      <div className="fixed top-0 w-full z-50">
        {promoAtivo && <EventoPromoBanner />}
        <nav className="w-full bg-[#faf9f6]/80 backdrop-blur-xl shadow-sm shadow-[#303330]/5">
          <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full relative">
            <a className="inline-flex" href="#">
              <BrandLockup
                priority
                labelClassName="font-headline text-2xl font-bold tracking-tight"
                logoClassName="h-9 w-9"
              />
            </a>
            <div className="hidden md:flex items-center gap-8">
              <a
                className="text-on-surface opacity-80 font-bold text-lg tracking-tight hover:text-tertiary transition-colors duration-300"
                href="#como-funciona"
              >
                Como Funciona
              </a>
              <a
                className="text-on-surface opacity-80 font-bold text-lg tracking-tight hover:text-tertiary transition-colors duration-300"
                href="#materias"
              >
                Matérias
              </a>
              <a
                className="text-on-surface opacity-80 font-bold text-lg tracking-tight hover:text-tertiary transition-colors duration-300"
                href="#plataforma"
              >
                Plataforma
              </a>
              <a
                className="text-on-surface opacity-80 font-bold text-lg tracking-tight hover:text-tertiary transition-colors duration-300"
                href="#contato"
              >
                Contato
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a
                className="hidden md:inline-block cursor-pointer text-on-surface px-6 py-2.5 rounded-lg font-bold text-sm transition-transform shadow-md hover:shadow-lg active:scale-90"
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Portal
              </a>
              <a
                className="hidden md:inline-block cursor-pointer bg-tertiary hover:bg-blue-700 text-on-tertiary px-6 py-2.5 rounded-lg font-bold text-sm transition-transform shadow-md hover:shadow-lg active:scale-90"
                href={zcalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Aula Diagnóstico
              </a>
              <MobileNav />
            </div>
          </div>
        </nav>
      </div>

      <main
        className={
          promoAtivo
            ? "pt-32 md:pt-28 overflow-x-hidden"
            : "pt-24 overflow-x-hidden"
        }
      >
        {/* ── Hero ── */}
        <section className="relative px-6 py-12 md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <FadeIn className="flex-1 space-y-8 text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container/30 border border-primary-container/50">
              <span className="material-symbols-outlined text-primary text-sm">
                location_on
              </span>
              <span className="text-primary font-bold text-xs uppercase tracking-widest">
                Manaus · AM
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-surface leading-[1.1] tracking-tight">
              Seu filho entendendo ciências e letras{" "}
              <span className="text-primary italic">de verdade</span>
            </h1>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200/50 shadow-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  menu_book
                </span>
                Português
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200/50 shadow-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  calculate
                </span>
                Matemática
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200/50 shadow-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  science
                </span>
                Física
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200/50 shadow-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  biotech
                </span>
                Química
              </span>
            </div>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-xl leading-relaxed">
              Acompanhamento presencial em Manaus, personalizado para cada
              aluno. Aulas particulares com profissionais formados,
              especialistas e com anos de experiência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                className="bg-tertiary hover:bg-blue-700 cursor-pointer text-on-tertiary px-8 py-4 rounded-xl font-bold text-center hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                href={zcalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Agendar Aula Diagnóstico
                <span className="material-symbols-outlined">
                  calendar_today
                </span>
              </a>
              <a
                className="bg-surface-container cursor-pointer text-primary border border-outline-variant/10 px-8 py-4 rounded-xl font-bold text-center hover:bg-surface-container-high transition-all active:scale-95 flex items-center justify-center gap-2"
                href="#materias"
              >
                Nossas Matérias
              </a>
            </div>
            <div className="flex items-center gap-8 pt-6 border-t border-outline-variant/10">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-primary">100%</span>
                <span className="text-xs text-on-surface-variant font-medium">
                  Presencial
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-primary">Ensino</span>
                <span className="text-xs text-on-surface-variant font-medium">
                  Fundamental &amp; Médio
                </span>
              </div>
            </div>
          </FadeIn>

          <FloatingCard className="flex-1 relative w-full aspect-square md:aspect-auto md:h-150">
            <div className="absolute inset-0 bg-primary/5 rounded-[4rem] -rotate-3 translate-x-4"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Professor Junior em ambiente de estudo"
              className="w-full h-full object-cover asymmetric-image-mask shadow-2xl relative z-10 grayscale-15 hover:grayscale-0 transition-all duration-700"
              src="/junior-professor-mestre.jpeg"
            />
            <div className="absolute -bottom-6 -left-6 glass-card p-4 rounded-2xl shadow-xl z-20 hidden md:block border border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                  <p className="font-bold text-primary">Deuticilam Júnior</p>
                  <p className="text-xs text-on-surface-variant">
                    Fundador &amp; Formado em Física
                  </p>
                </div>
              </div>
            </div>
          </FloatingCard>
        </section>

        {promoAtivo && <EventoPromoSection />}

        {/* ── Como Funciona ── */}
        <section
          className="bg-surface-container-low py-24 px-6 mt-12 rounded-t-[4rem]"
          id="como-funciona"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">
                Um método focado no{" "}
                <span className="text-primary underline decoration-tertiary/40">
                  acolhimento
                </span>
              </h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">
                Nossas aulas ocorrem no conforto do seu lar, eliminando o
                estresse do trânsito e criando um ambiente seguro para o
                aprendizado.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-surface p-8 rounded-3xl border-b-4 border-primary-container hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined text-3xl">
                    event_available
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4">
                  1. Agende sua aula diagnóstico
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  O primeiro passo é agendar sua aula diagnóstico. Escolha o
                  melhor horário para uma primeira visita do professor
                  especialista.
                </p>
              </div>
              <div className="bg-surface p-8 rounded-3xl border-b-4 border-tertiary-fixed hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl bg-tertiary-container flex items-center justify-center mb-6 text-on-tertiary-container">
                  <span className="material-symbols-outlined text-3xl">
                    home_pin
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4">
                  2. Visita à domicílio
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  O professor vai até sua casa em Manaus para conhecer o aluno e
                  identificar as dificuldades específicas em cada matéria.
                </p>
              </div>
              <div className="bg-surface p-8 rounded-3xl border-b-4 border-primary hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-6 text-on-primary">
                  <span className="material-symbols-outlined text-3xl">
                    trending_up
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4">
                  3. Plano Personalizado
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Iniciamos o acompanhamento com cronograma sob medida, focando
                  em resultados e na autonomia do estudante.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sobre ── */}
        <section className="py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Professor ensinando aluna"
                className="rounded-[2.5rem] w-full h-125 object-cover shadow-xl group-hover:scale-[1.02] transition-transform duration-500"
                src="/junior-professor.png"
              />
              <div className="absolute -top-4 -right-4 bg-tertiary text-on-tertiary px-6 py-4 rounded-2xl font-bold shadow-lg">
                Excelência Acadêmica
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-6">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">
              Sobre a Equipe Aprova+
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              A Equipe Aprova+ foi fundada e é liderada pelo{" "}
              <strong>Prof. Deuticilam Junior</strong>, bacharel em Física e
              mestre em Física da Matéria Condensada pela UFAM (Universidade
              Federal do Amazonas). Com reconhecimento científico internacional,
              ele possui pesquisas publicadas em veículos de prestígio como a{" "}
              <a
                href="https://www.nature.com/articles/s41598-018-21968-9"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors"
              >
                Nature Scientific Reports
              </a>
              .
            </p>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Sob a sua coordenação, nossa equipe especializada de professores
              em ciências exatas e linguagens atua de forma unificada. O que nos
              une é um <strong>método educacional único e padronizado</strong>,
              aplicando o mesmo rigor acadêmico e dedicação no acompanhamento
              escolar do seu filho para garantir uma qualidade excepcional em
              todas as disciplinas.
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
              <span className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-sm font-bold">
                Ciências Exatas e Linguagens
              </span>
              <span className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-sm font-bold">
                Método Unificado
              </span>
            </div>
          </div>
        </section>

        {/* ── O Método Aprova+ ── */}
        <section
          className="bg-surface-container-lowest py-24 px-6 rounded-[3.5rem] md:rounded-[4rem] my-8 md:my-12"
          id="metodo"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-5 space-y-6">
                <span className="px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-bold tracking-wider uppercase">
                  Metodologia Exclusiva
                </span>
                <h2 className="text-3xl mt-2 md:text-5xl font-headline font-bold text-on-surface leading-tight">
                  O Método <br className="hidden md:inline" />
                  <span className="text-primary">Aprova+</span>
                </h2>
                <p className="text-lg text-on-surface-variant leading-relaxed">
                  Criado pelo Prof. Deuticilam Junior a partir de anos de
                  experiência com ensino domiciliar, nosso método é estruturado
                  para gerar alto desempenho e independência total. Não queremos
                  que o aluno dependa de nós para sempre, mas sim que aprenda a
                  aprender.
                </p>
                <div className="bg-surface p-6 rounded-3xl border border-outline/5 shadow-sm space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-tertiary-container flex items-center justify-center text-on-tertiary-container shrink-0">
                      <span className="material-symbols-outlined text-xl">
                        psychology
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">
                        Equipe Altamente Treinada
                      </h4>
                      <p className="text-on-surface-variant text-sm mt-1">
                        Todos os nossos professores passam por um rigoroso
                        treinamento no método do fundador, garantindo uma
                        abordagem unificada e focada em resultados reais de alto
                        desempenho.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
                {/* Pilar 1: Sintese e Foco */}
                <div className="bg-surface p-8 rounded-3xl border border-outline/5 shadow-sm space-y-4 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">
                      summarize
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">
                    Síntese Direcionada
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    Sintetizamos o que foi abordado na escola focando
                    estritamente no que é mais relevante e na maior dificuldade
                    do aluno, otimizando ao máximo o tempo de estudo.
                  </p>
                </div>

                {/* Pilar 2: Prática e Autonomia */}
                <div className="bg-surface p-8 rounded-3xl border border-outline/5 shadow-sm space-y-4 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">
                      assignment_turned_in
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">
                    Base & Autonomia
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    O aprendizado inicia com um resumo conceitual, seguido da
                    observação do professor resolvendo questões modelo.
                    Intensificamos as listas de exercícios para que o aluno
                    ganhe confiança e total autonomia, sem depender de ninguém
                    para fazer sozinho.
                  </p>
                </div>

                {/* Pilar 3: Aprendizado Lúdico */}
                <div className="bg-surface p-8 rounded-3xl border border-outline/5 shadow-sm space-y-4 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">
                      sentiment_satisfied
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">
                    Método Lúdico
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    Utilizamos métodos lúdicos de ensino e uma linguagem
                    totalmente acessível que descomplica temas complexos das
                    exatas e de linguagens, aproximando-os da realidade do
                    aluno.
                  </p>
                </div>

                {/* Pilar 4: Atalhos e Macetes */}
                <div className="bg-surface p-8 rounded-3xl border border-outline/5 shadow-sm space-y-4 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">
                      tips_and_updates
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">
                    Dicas e Macetes
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    Ao resumirmos o conteúdo, ensinamos macetes exclusivos,
                    dicas práticas e diferenciais de raciocínio que facilitam
                    incrivelmente a absorção rápida do assunto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Matérias & Foco ── */}
        <section
          className="bg-surface-container-low py-24 px-6 rounded-[3.5rem] md:rounded-[4rem] my-8 md:my-12"
          id="materias"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">
                Matérias & Foco
              </h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">
                Cobertura completa nas principais disciplinas para garantir um
                desenvolvimento acadêmico sólido.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Português */}
              <div className="bg-surface p-8 rounded-3xl border border-outline/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-start">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl">
                    menu_book
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-on-surface">
                  Português
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  Desenvolvimento da leitura crítica, interpretação de textos e
                  excelência na escrita e redação.
                </p>
              </div>

              {/* Matemática */}
              <div className="bg-surface p-8 rounded-3xl border border-outline/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-start">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl">
                    calculate
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-on-surface">
                  Matemática
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  Construção do raciocínio lógico e resolução de problemas,
                  desmistificando os números de forma prática.
                </p>
              </div>

              {/* Física */}
              <div className="bg-surface p-8 rounded-3xl border border-outline/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-start">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl">
                    science
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-on-surface">
                  Física
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  Compreensão dos fenômenos naturais com abordagem focada em
                  aplicações do mundo real.
                </p>
              </div>

              {/* Química */}
              <div className="bg-surface p-8 rounded-3xl border border-outline/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-start">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl">
                    biotech
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-on-surface">
                  Química
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  Estudo das transformações da matéria de maneira visual,
                  facilitando o entendimento de conceitos complexos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Plataforma Exclusiva ── */}
        <section
          className="py-24 px-6 max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center"
          id="plataforma"
        >
          <div className="lg:col-span-5 space-y-8">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface leading-tight">
              Plataforma Exclusiva
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Uma inovação exclusiva em Manaus. Nossa plataforma digital
              complementa o ensino presencial, oferecendo acompanhamento
              contínuo e escalável do desenvolvimento do aluno.
            </p>

            <ul className="space-y-6">
              <li className="flex gap-4">
                <span
                  className="material-symbols-outlined text-primary text-2xl font-bold shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <div>
                  <h4 className="font-bold text-on-surface text-lg">
                    Acompanhamento de Tarefas
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-1">
                    Organização e controle de atividades personalizadas para
                    cada estudante.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span
                  className="material-symbols-outlined text-primary text-2xl font-bold shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <div>
                  <h4 className="font-bold text-on-surface text-lg">
                    Materiais Compartilhados
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-1">
                    Acesso a resumos, listas de exercícios e conteúdos extras
                    direcionados.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span
                  className="material-symbols-outlined text-primary text-2xl font-bold shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <div>
                  <h4 className="font-bold text-on-surface text-lg">
                    Monitoramento de Progresso
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-1">
                    Gráficos e relatórios de desempenho para pais e alunos
                    acompanharem a evolução.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7 flex justify-center bg-transparent items-center w-full">
            {/* Screenshot directly with relative/aspect layout for image and rounded details */}
            <div className="w-full bg-transparent rounded-lg overflow-hidden shadow-xl relative aspect-16/10">
              <Image
                src="/plataforma.png"
                alt="Screenshot do painel do aluno Aprova+"
                fill
                quality={20}
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* ── Banner WhatsApp Transparência Total ── */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="bg-[#1d6875] text-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left shadow-lg">
            <div className="space-y-2">
              <h3 className="text-2xl md:text-3xl font-headline font-bold">
                Transparência total
              </h3>
              <p className="opacity-90 text-sm md:text-base leading-relaxed">
                Quer conversar com famílias que já estudaram conosco? Peça
                nossos contatos de referência.
              </p>
            </div>
            <a
              className="bg-[#32d74b] hover:bg-[#25D366] cursor-pointer text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all duration-300 shrink-0 shadow-md"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-xl font-bold">
                chat
              </span>
              Falar pelo WhatsApp
            </a>
          </div>
        </section>

        {/* ── CTA Final ── */}
        <section
          className="py-24 px-6 bg-inverse-surface text-on-primary text-center rounded-t-[4rem]"
          id="contato"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="w-20 h-20 bg-tertiary rounded-full mx-auto flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-4xl text-on-tertiary">
                school
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-headline font-bold">
              Agende sua Aula Diagnóstico
            </h2>
            <p className="text-xl opacity-70">
              Sem compromisso. O professor vai até você para diagnosticar as
              necessidades do aluno e propor o melhor caminho.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <a
                className="bg-tertiary hover:bg-blue-700 cursor-pointer text-on-tertiary px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all"
                href={zcalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Agendar Aula Diagnóstico
              </a>
              <a
                className="bg-white/10 backdrop-blur-md cursor-pointer text-white border border-white/20 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar direto pelo WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-surface-container-low w-full rounded-t-4xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-8 py-12 max-w-7xl mx-auto w-full">
          <div className="mb-8 md:mb-0 space-y-4">
            <a className="inline-flex" href="#">
              <BrandLockup
                labelClassName="font-headline text-xl font-black"
                logoClassName="h-8 w-8"
              />
            </a>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs">
              Resultado que aparece. Educação personalizada no coração de
              Manaus.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            <div className="space-y-4">
              <h4 className="font-bold text-primary">Nossas redes</h4>
              <div className="flex flex-col gap-2">
                <a
                  className="text-on-surface-variant opacity-70 hover:opacity-100 hover:text-primary transition-all text-sm"
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram @{teacher.instagramHandle}
                </a>
                <a
                  className="text-on-surface-variant opacity-70 hover:opacity-100 hover:text-primary transition-all text-sm"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-primary">Acesso</h4>
              <div className="flex flex-col gap-2">
                <a
                  className="text-tertiary font-semibold hover:opacity-100 transition-all text-sm"
                  href="https://app.aprovamaiscurso-pro.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Área do Aluno
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 pb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-outline-variant/10 pt-8">
          <p className="text-on-surface-variant opacity-70 text-xs">
            © 2026 Aprova+ · Manaus, AM
          </p>
          <div className="flex gap-5">
            <a
              href="/privacidade"
              className="text-on-surface-variant opacity-70 hover:opacity-100 text-xs transition-opacity"
            >
              Privacidade
            </a>
            <a
              href="/termos"
              className="text-on-surface-variant opacity-70 hover:opacity-100 text-xs transition-opacity"
            >
              Termos de Uso
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
