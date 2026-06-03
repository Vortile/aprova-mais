"use client";

import { useState } from "react";
import { teacher } from "@/lib/teacher";

const { zcalUrl, portalUrl } = teacher;

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden text-primary"
        onClick={() => setOpen(!open)}
        aria-label="Abrir menu"
      >
        <span className="material-symbols-outlined text-3xl">
          {open ? "close" : "menu"}
        </span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 bg-surface/95 backdrop-blur-xl shadow-lg px-6 py-6 flex flex-col gap-5 md:hidden">
          <a
            href="#como-funciona"
            className="text-on-surface font-bold text-lg"
            onClick={() => setOpen(false)}
          >
            Como Funciona
          </a>
          <a
            href="#depoimentos"
            className="text-on-surface font-bold text-lg"
            onClick={() => setOpen(false)}
          >
            Depoimentos
          </a>
          <a
            href="#contato"
            className="text-on-surface font-bold text-lg"
            onClick={() => setOpen(false)}
          >
            Contato
          </a>

          <a
            className="md:inline-block text-on-surface px-6 py-3 rounded-lg font-bold text-sm transition-transform text-center shadow-md hover:shadow-lg active:scale-90"
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Acessar Portal do Aluno
          </a>
          <a
            className="bg-tertiary text-on-tertiary px-6 py-3 rounded-lg font-bold text-sm text-center"
            href={zcalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Aula Grátis
          </a>
        </div>
      )}
    </>
  );
}
