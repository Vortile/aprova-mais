import Link from "next/link";

/** Slim, high-contrast announcement bar promoting the Intensivão — deliberately
 * breaks brand teal for a "campaign" look. Only rendered while promoAtivo. */
export function EventoPromoBanner() {
  return (
    <Link
      href="/intensivao-medicina"
      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-center text-sm font-bold transition-colors"
    >
      <span className="material-symbols-outlined text-base">bolt</span>
      <span className="hidden sm:inline">
        Intensivão ENEM 2026 — Foco Medicina: 3 sábados presenciais em Manaus.
      </span>
      <span className="sm:hidden">Intensivão ENEM 2026 — Foco Medicina</span>
      <span className="font-black underline underline-offset-2 whitespace-nowrap">
        Garantir vaga →
      </span>
    </Link>
  );
}
