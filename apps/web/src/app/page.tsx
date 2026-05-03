import { MobileNav } from "@/components/mobile-nav";
import { BrandLockup } from "@/components/brand-lockup";
import { teacher, whatsappUrl, instagramUrl } from "@/lib/teacher";
import { DepoimentosSection } from "@/components/depoimentos-section";
import { createClient } from "@repo/db";
import { unstable_cache } from "next/cache";

const { zcalUrl } = teacher;

type DepoimentoRow = {
  id: string;
  quote: string;
  author: string;
  sort_order: number;
};

const getDepoimentos = unstable_cache(
  async (): Promise<DepoimentoRow[]> => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      );
      const { data, error } = await supabase
        .from("depoimentos")
        .select("id, quote, author, sort_order")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },
  ["depoimentos"],
  { revalidate: 60 },
);

export default async function WebHomePage() {
  const depoimentos = await getDepoimentos();
  return (
    <>
      {/* ── Top Nav ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#faf9f6]/80 backdrop-blur-xl shadow-sm shadow-[#303330]/5">
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
              href="#depoimentos"
            >
              Depoimentos
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
              className="hidden md:inline-block bg-tertiary text-on-tertiary px-6 py-2.5 rounded-lg font-bold text-sm transition-transform shadow-md hover:shadow-lg active:scale-90"
              href={zcalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Aula Grátis
            </a>
            <MobileNav />
          </div>
        </div>
      </nav>

      <main className="pt-24 overflow-x-hidden">
        {/* ── Hero ── */}
        <section className="relative px-6 py-12 md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container/30 border border-primary-container/50">
              <span className="material-symbols-outlined text-primary text-sm">
                location_on
              </span>
              <span className="text-primary font-bold text-xs uppercase tracking-widest">
                Manaus · AM
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-surface leading-[1.1] tracking-tight">
              Seu filho entendendo física e matemática{" "}
              <span className="text-primary italic">de verdade</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-xl leading-relaxed">
              Acompanhamento presencial em Manaus, personalizado para cada
              aluno. Aulas particulares com profissional formado em Física e
              anos de experiência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                className="bg-tertiary text-on-tertiary px-8 py-4 rounded-xl font-bold text-center hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                href={zcalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Quero a Aula Grátis
                <span className="material-symbols-outlined">
                  calendar_today
                </span>
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
          </div>

          <div className="flex-1 relative w-full aspect-square md:aspect-auto md:h-150">
            <div className="absolute inset-0 bg-primary/5 rounded-[4rem] -rotate-3 translate-x-4"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Professor sorridente em ambiente de estudo"
              className="w-full h-full object-cover asymmetric-image-mask shadow-2xl relative z-10 grayscale-15 hover:grayscale-0 transition-all duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnCkt3ZhQx3A74KctAUgmmR19bEL9v8wzxtBnDgVnHnLS5ihnxt2LIucS7eUeonCqNxQsuklPSh1IU5zSAFrQ5uK2y7GeTBK1xS9sNuLJNHdcs_kmzBU5zCLP-ZteHYtPsz5sJTFflI6jkXxcvJdDroaTbF4YxjU3bGkpWE-0cC3cKcKlLg3X3NF96VFInziUYQY8Xu7XNs7m_JyxwCTKK9rCAKnasBTgaIO7VfH9VWQEuKe-SaqTrHrW5ZP1ZT1_--rlvbzvm7GWt"
            />
            <div className="absolute -bottom-6 -left-6 glass-card p-6 rounded-2xl shadow-xl z-20 hidden md:block border border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                  <p className="font-bold text-primary">Formado em Física</p>
                  <p className="text-xs text-on-surface-variant">
                    Qualidade acadêmica real
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                  1. Agende a aula experimental
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  O primeiro passo é totalmente gratuito. Escolha o melhor
                  horário para uma primeira conversa sem compromisso.
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
                +10 anos de experiência
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-6">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">
              Dedicado ao sucesso do seu filho
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Sou formado em Física com especialização no ensino de ciências
              exatas. Meu método não foca apenas na resolução de exercícios, mas
              em despertar a curiosidade e a confiança do aluno. Atendo do
              Fundamental I ao Ensino Médio.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-sm font-bold">
                Formado em Física
              </span>
              <span className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-sm font-bold">
                Ensino Fundamental e Médio
              </span>
              <span className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-sm font-bold">
                Método Personalizado
              </span>
            </div>
            <div className="pt-6">
              <p className="text-on-surface font-semibold mb-4">
                Experiência comprovada em:
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-on-surface-variant">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  Preparação para provas e vestibulares
                </li>
                <li className="flex items-center gap-3 text-on-surface-variant">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  Recuperação paralela e final
                </li>
                <li className="flex items-center gap-3 text-on-surface-variant">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  Reforço contínuo em Exatas e Inglês
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Depoimentos ── */}
        <DepoimentosSection
          depoimentos={depoimentos}
          whatsappUrl={whatsappUrl}
        />

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
              A primeira aula é por nossa conta
            </h2>
            <p className="text-xl opacity-70">
              Sem compromisso. O professor vai até você para diagnosticar as
              necessidades do aluno e propor o melhor caminho.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <a
                className="bg-tertiary text-on-tertiary px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all"
                href={zcalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Agendar Aula Grátis
              </a>
              <a
                className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
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
              Resultado que aparece. Sou {teacher.firstName}, professor
              particular em Manaus.
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
