import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";
import { teacher, whatsappUrl } from "@/lib/teacher";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o Aprova+ trata seus dados pessoais. Transparência total sobre coleta, uso e proteção de informações.",
  alternates: { canonical: "/privacidade" },
  robots: { index: false, follow: false },
};

export default function PrivacidadePage() {
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
            Política de Privacidade
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Sua privacidade importa. Este documento explica de forma direta
            quais dados coletamos, por que e como os protegemos.
          </p>
        </div>

        <Section title="1. Quem sou">
          <p>
            Aprova+ é um serviço de aulas particulares presenciais em Manaus,
            AM, operado por mim, <strong>{teacher.fullName}</strong>. Para
            dúvidas ou solicitações relacionadas a dados, entre em contato pelo
            WhatsApp indicado no site.
          </p>
        </Section>

        <Section title="2. Dados que coletamos">
          <p>Coletamos apenas o necessário para oferecer o serviço:</p>
          <ul>
            <li>
              <strong>Nome e contato</strong> (telefone/WhatsApp, e-mail) —
              fornecidos por você ao agendar uma aula ou preencher um
              formulário.
            </li>
            <li>
              <strong>Nome e série do aluno</strong> — para personalizar o
              acompanhamento pedagógico.
            </li>
            <li>
              <strong>Dados de agendamento</strong> — gerenciados pela
              plataforma Zcal; consulte a política deles em{" "}
              <a
                href="https://zcal.co/privacy"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                zcal.co/privacy
              </a>
              .
            </li>
          </ul>
          <p>
            Não coletamos documentos, dados financeiros completos nem
            informações sensíveis.
          </p>
        </Section>

        <Section title="3. Para que usamos">
          <ul>
            <li>Agendar e confirmar aulas experimentais e regulares.</li>
            <li>Enviar lembretes e comunicados sobre as aulas.</li>
            <li>Personalizar o plano de estudos do aluno.</li>
            <li>Responder dúvidas e solicitações suas.</li>
          </ul>
          <p>
            Não usamos seus dados para publicidade de terceiros nem os vendemos
            a ninguém.
          </p>
        </Section>

        <Section title="4. Compartilhamento">
          <p>
            Seus dados são compartilhados apenas com as ferramentas que uso para
            operar o serviço (Zcal para agendamentos, WhatsApp para
            comunicação). Nunca repasso suas informações a outras empresas ou
            parceiros comerciais.
          </p>
        </Section>

        <Section title="5. Por quanto tempo guardamos">
          <p>
            Mantemos seus dados enquanto você for aluno ativo ou enquanto houver
            interesse legítimo de contato. Após o encerramento do serviço,
            excluímos os dados em até 90 dias.
          </p>
        </Section>

        <Section title="6. Seus direitos">
          <p>
            Você pode, a qualquer momento, solicitar acesso, correção ou
            exclusão dos seus dados. Basta entrar em contato pelo WhatsApp.
            Respondo em até 5 dias úteis.
          </p>
        </Section>

        <Section title="7. Segurança">
          <p>
            Utilizamos ferramentas com criptografia padrão de mercado. Não
            armazenamos senhas nem dados de cartão. O acesso à plataforma do
            aluno é protegido por autenticação segura.
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
