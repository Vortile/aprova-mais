type DepoimentoRow = {
  id: string;
  quote: string;
  author: string;
  sort_order: number;
};

const fallbackDepoimentos: DepoimentoRow[] = [
  {
    id: "1",
    quote:
      "Meu filho tinha pavor de física. Depois de 2 meses de acompanhamento, ele tirou a maior nota da sala no 9º ano. Incrível a paciência do professor.",
    author: "— Mãe do João, 9º ano",
    sort_order: 0,
  },
  {
    id: "2",
    quote:
      "O diferencial é vir em casa. Facilitou muito nossa rotina em Manaus. A didática é moderna e ele se conecta muito bem com os adolescentes.",
    author: "— Pai da Ana Clara, 1º Médio",
    sort_order: 1,
  },
  {
    id: "3",
    quote:
      "Sempre muito pontual e dedicado. As notas em matemática subiram consistentemente. Recomendo para quem busca segurança e resultado.",
    author: "— Mãe do Lucas, 8º ano",
    sort_order: 2,
  },
];

export function DepoimentosSection({
  depoimentos,
  whatsappUrl,
}: {
  depoimentos: DepoimentoRow[];
  whatsappUrl: string;
}) {
  const display = depoimentos.length > 0 ? depoimentos : fallbackDepoimentos;

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="depoimentos">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">
          O que as famílias dizem
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {display.map((dep) => (
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
      <div className="mt-16 bg-primary text-on-primary p-8 md:p-12 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div>
          <h3 className="text-2xl font-bold mb-2">Transparência total</h3>
          <p className="opacity-90">
            Quer conversar com famílias que já estudaram com o professor? Peça
            nossos contatos de referência.
          </p>
        </div>
        <a
          className="bg-[#25D366] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shrink-0"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Falar pelo WhatsApp
        </a>
      </div>
    </section>
  );
}
