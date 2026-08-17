import Link from "next/link";

/** Highlighted mid-page invite to the Intensivão — only rendered while
 * promoAtivo (event active, has seats, first Saturday hasn't started). */
export function EventoPromoSection() {
  return (
    <section className="px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 md:p-12 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Image Thumbnail / Badge */}
            <div className="relative shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/medicina-estudo.jpg"
                alt="Material e estetoscópio de Medicina"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-blue-950/80 backdrop-blur-md rounded-xl py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider text-blue-100">
                Foco Medicina
              </div>
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-xs font-bold uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">bolt</span>
                Evento Presencial · Manaus
              </span>
              <h2 className="text-2xl md:text-4xl font-headline font-bold leading-tight">
                Intensivão ENEM 2026 — Foco Medicina
              </h2>
              <p className="text-blue-50 text-base md:text-lg leading-relaxed max-w-xl">
                3 sábados presenciais com o Prof. Júnior para destravar a nota
                de Medicina na TRI. Turma pequena, vagas limitadas.
              </p>
            </div>

            <Link
              href="/intensivao-medicina"
              className="shrink-0 bg-white text-blue-700 px-8 py-4 rounded-xl font-bold hover:shadow-2xl transition-all active:scale-95 inline-flex items-center gap-2 whitespace-nowrap"
            >
              Conhecer o Intensivão
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
