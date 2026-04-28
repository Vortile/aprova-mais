import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";
import { teacher, whatsappUrl } from "@/lib/teacher";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Condições para contratação e uso dos serviços do Aprova+ em Manaus.",
  alternates: { canonical: "/termos" },
  robots: { index: false, follow: false },
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav strip */}
      <div className="px-6 py-5 border-b border-outline-variant/10">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex">
            <BrandLockup
              labelClassName="font-headline text-xl font-black"
              logoClassName="h-8 w-8"
            />
          </Link>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Última atualização: abril de 2026
          </p>
          <h1 className="text-4xl font-headline font-bold text-on-surface leading-tight">
            Termos de Uso
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Ao contratar os serviços do Aprova+, você concorda com as condições
            abaixo. São simples, diretas e pensadas para proteger tanto o aluno
            quanto eu, {teacher.firstName}.
          </p>
        </div>

        <Section title="1. O serviço">
          <p>
            Ofereço aulas particulares presenciais em Manaus, AM, nas
            disciplinas de Física, Matemática e Inglês, para alunos do Ensino
            Fundamental e Médio. As aulas acontecem na residência do aluno ou em
            local combinado.
          </p>
        </Section>

        <Section title="2. Aula experimental gratuita">
          <p>
            A primeira aula é gratuita, sem compromisso. Ela serve para eu
            conhecer o aluno, identificar dificuldades e apresentar meu método.
            Não há obrigação de contratar após a aula experimental.
          </p>
        </Section>

        <Section title="3. Contratação e pagamento">
          <ul>
            <li>
              O serviço é cobrado mensalmente, sem contrato de fidelidade. Você
              pode cancelar a qualquer momento com aviso prévio de{" "}
              <strong>7 dias</strong>.
            </li>
            <li>
              O pagamento é feito via <strong>Pix ou cartão de crédito</strong>,
              no início de cada mês de serviço.
            </li>
            <li>
              O não pagamento dentro do prazo acertado pode resultar na
              suspensão das aulas até a regularização.
            </li>
          </ul>
        </Section>

        <Section title="4. Cancelamento de aulas">
          <p>
            Cancelamentos com menos de <strong>24 horas de antecedência</strong>{" "}
            pela família podem ser cobrados normalmente. Cancelamentos meus
            serão repostos sem custo adicional. Situações de força maior (saúde,
            emergência familiar) são tratadas caso a caso com bom senso.
          </p>
        </Section>

        <Section title="5. Conduta">
          <p>
            Esperamos um ambiente respeitoso entre aluno, família e professor.
            Comportamentos que comprometam o aprendizado, a segurança ou o
            respeito mútuo podem levar ao encerramento do contrato, sem
            reembolso do período já prestado.
          </p>
        </Section>

        <Section title="6. Responsabilidade">
          <p>
            Me comprometo a oferecer aulas de qualidade, com pontualidade e
            dedicação. Não garanto resultados específicos em notas ou provas,
            pois o aprendizado depende também do engajamento do aluno. Faço tudo
            ao meu alcance para que o progresso aconteça.
          </p>
        </Section>

        <Section title="7. Alterações nestes termos">
          <p>
            Posso atualizar estes termos eventualmente. Em caso de mudanças
            relevantes, avisarei via WhatsApp com antecedência. O uso continuado
            do serviço após a notificação implica aceite das novas condições.
          </p>
        </Section>

        <Section title="8. Contato">
          <p>
            Dúvidas sobre estes termos? Fale comigo pelo WhatsApp indicado no
            site. Respondo rápido.
          </p>
        </Section>

        <div className="pt-8 border-t border-outline-variant/10">
          <Link
            href="/"
            className="text-primary font-bold hover:text-tertiary transition-colors"
          >
            ← Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-on-surface">{title}</h2>
      <div className="text-on-surface-variant leading-relaxed space-y-3 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
