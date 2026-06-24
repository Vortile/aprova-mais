type DepoimentoRow = {
  id: string;
  quote: string;
  author: string;
  sort_order: number;
};

export function DepoimentosSection({
  depoimentos,
  whatsappUrl,
}: {
  depoimentos: DepoimentoRow[];
  whatsappUrl: string;
}) {
  if (depoimentos.length === 0) return null;

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="depoimentos">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">
          O que as famílias dizem
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {depoimentos.map((dep) => (
          <div
            key={dep.id}
            className="bg-surface-container-low p-8 rounded-3xl italic text-on-surface-variant relative"
          >
            <span className="material-symbols-outlined text-6xl text-primary/10 absolute top-4 left-4">
              format_quote
            </span>
            <p className="relative z-10 mb-6">&ldquo;{dep.quote}&rdquo;</p>
            <cite className="not-italic block font-bold text-on-surface">
              {dep.author}
            </cite>
          </div>
        ))}
      </div>
    </section>
  );
}
