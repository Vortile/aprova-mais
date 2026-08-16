"use client";

import { useState } from "react";

const TABS = [
  {
    key: "aluno",
    label: "Para o Estudante",
    icon: "school",
    title: "Chega de travar nos 720 pontos.",
    body: "Você já estuda muito e sente que não sai do lugar. O problema não é esforço — é foco no que a TRI de Medicina realmente cobra. Em 3 sábados, você aprende exatamente onde estão os pontos que faltam para a nota de corte, treina com questões no padrão exato da prova e sai com um plano claro para os últimos meses antes do ENEM.",
  },
  {
    key: "pais",
    label: "Para os Pais",
    icon: "family_restroom",
    title: "Um investimento pequeno perto do que está em jogo.",
    body: "Uma vaga em Medicina via ENEM elimina a necessidade de uma faculdade particular de R$ 9 a 14 mil por mês. O Intensivão é presencial, em local fechado e supervisionado, com professor especialista e conteúdo 100% focado na aprovação — não é mais um curso genérico, é a reta final estratégica que faltava.",
  },
] as const;

export function DualAudienceTabs() {
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("aluno");
  const current = TABS.find((tab) => tab.key === active)!;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-center gap-3 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-5 py-3 rounded-full font-bold text-sm transition-colors flex items-center gap-2 cursor-pointer ${
              active === tab.key
                ? "bg-primary text-on-primary"
                : "bg-secondary-container text-on-secondary-container"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-surface p-8 md:p-10 rounded-3xl">
        <h3 className="text-2xl font-headline font-bold text-on-surface mb-4">
          {current.title}
        </h3>
        <p className="text-on-surface-variant leading-relaxed text-lg">
          {current.body}
        </p>
      </div>
    </div>
  );
}
