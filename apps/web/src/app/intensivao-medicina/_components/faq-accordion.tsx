"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { evento } from "@/lib/evento/config";

const FAQ_ITEMS = [
  {
    question: "E se eu perder um dos sábados?",
    answer:
      "O conteúdo é sequencial e presencial, então recomendamos fortemente participar dos 4 dias. Caso perca um encontro, disponibilizamos o resumo e os mapas mentais pelo WhatsApp para você não ficar para trás.",
  },
  {
    question: "Menor de idade pode ir desacompanhado?",
    answer:
      "Sim. Coletamos o nome e WhatsApp de um responsável no ato da inscrição para qualquer contato de emergência, mas o aluno participa normalmente das aulas sem necessidade de acompanhante durante o evento.",
  },
  {
    question: "O que está incluso no material?",
    answer:
      "A apostila física com questões comentadas e os mapas mentais estratégicos de Física e Matemática estão inclusos no valor da inscrição. Você recebe o material impresso no primeiro dia.",
  },
  {
    question: "Como funciona o pagamento?",
    answer:
      "Você pode pagar via PIX (aprovação imediata) ou Cartão de Crédito em até 12x. Assim que o pagamento é confirmado, o ingresso com QR Code chega automaticamente no seu e-mail.",
  },
  {
    question: "Como sei em qual turma (sala) eu fiquei?",
    answer: `Todas as turmas acontecem no mesmo horário (${evento.horarioGeral}). As vagas são organizadas por ordem de confirmação de pagamento: os primeiros 13 pagantes ficam na ${evento.salaTurma1} e os próximos 13 na segunda sala. Sua sala é informada no e-mail de confirmação.`,
  },
] as const;

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className="bg-surface rounded-2xl overflow-hidden"
          >
            <button
              className="w-full flex items-center justify-between gap-4 p-6 text-left cursor-pointer"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="font-bold text-on-surface">{item.question}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="material-symbols-outlined text-primary shrink-0"
              >
                keyboard_arrow_down
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-on-surface-variant leading-relaxed">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
