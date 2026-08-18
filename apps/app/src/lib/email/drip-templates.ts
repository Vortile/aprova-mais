import { evento as eventoConfig } from "@/lib/evento/config";
import { teacher, guestTeacher, whatsappUrl } from "@/lib/teacher";

export type DripEmailType =
  | "guia_preparacao"
  | "mensagem_professor"
  | "mapa_tri"
  | "checklist_evento"
  | "devolutiva_dia1"
  | "devolutiva_dia2"
  | "devolutiva_dia3"
  | "pos_evento";

export const DRIP_EMAIL_LABELS: Record<
  DripEmailType,
  { title: string; trigger: string; icon: string }
> = {
  guia_preparacao: {
    title: "1. Guia de Preparação",
    trigger: "Enviado 2 dias após a confirmação do pagamento",
    icon: "menu_book",
  },
  mensagem_professor: {
    title: "2. Mensagem do Prof. Deuticilam",
    trigger: "Enviado 4 dias após a compra",
    icon: "chat",
  },
  mapa_tri: {
    title: "3. Estratégia de Prova no ENEM",
    trigger: "Enviado 6 dias após a compra",
    icon: "analytics",
  },
  checklist_evento: {
    title: "4. Checklist do Sábado 1",
    trigger: "Enviado 2 dias antes do 1º encontro (quinta-feira)",
    icon: "checklist",
  },
  devolutiva_dia1: {
    title: "5. Devolutiva do Sábado 1",
    trigger: "Enviado no domingo seguinte ao Sábado 1",
    icon: "rate_review",
  },
  devolutiva_dia2: {
    title: "6. Devolutiva do Sábado 2",
    trigger: "Enviado no domingo seguinte ao Sábado 2",
    icon: "rate_review",
  },
  devolutiva_dia3: {
    title: "7. Devolutiva do Sábado 3",
    trigger: "Enviado no domingo seguinte ao Sábado 3",
    icon: "rate_review",
  },
  pos_evento: {
    title: "8. Certificado Pós-Evento",
    trigger: "Enviado no domingo após o último sábado (04/10)",
    icon: "workspace_premium",
  },
};

export function wrapDripLayout(params: {
  title: string;
  preheader: string;
  bodyHtml: string;
}) {
  const { title, preheader, bodyHtml } = params;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${title}</title>
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
      body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
      @media only screen and (max-width: 620px) {
        .mobile-container { width: 100% !important; max-width: 100% !important; padding: 12px !important; }
        .mobile-card { padding: 24px 16px !important; border-radius: 16px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#0f172a;">
    
    <!-- Preheader preview text for mail clients -->
    <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      ${preheader}
    </div>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;table-layout:fixed;">
      <tr>
        <td align="center" style="padding:32px 12px;" class="mobile-container">
          
          <!-- Outer 600px Max Card -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:24px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 25px -5px rgba(15, 23, 42, 0.08);">
            
            <!-- Brand Header -->
            <tr>
              <td style="background-color:#0f172a;padding:26px 32px;text-align:center;">
                <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                  <tr>
                    <td valign="middle" style="padding-right:12px;">
                      <img src="https://aprovamaiscurso-pro.com.br/logo-blue.png" alt="Aprova+" width="34" height="34" style="display:block;border:0;width:34px;height:34px;border-radius:6px;" />
                    </td>
                    <td valign="middle" align="left">
                      <div style="font-size:24px;font-weight:800;color:#ffffff;line-height:28px;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                        Aprova<span style="color:#38bdf8;">+</span>
                      </div>
                    </td>
                  </tr>
                </table>
                <p style="margin:6px 0 0 0;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">
                  Curso &amp; Mentoria de Alta Performance
                </p>
              </td>
            </tr>

            <!-- Content Area -->
            <tr>
              <td style="padding:36px 32px 28px 32px;" class="mobile-card">
                ${bodyHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 32px;text-align:center;">
                <p style="font-size:12px;line-height:20px;color:#64748b;margin:0 0 8px 0;">
                  <strong>Aprova+ – Aulas Particulares &amp; Preparação com Profissionais</strong><br />
                  ${eventoConfig.localEndereco} · Contato: ${eventoConfig.localContato}
                </p>
                <p style="font-size:11px;line-height:16px;color:#94a3b8;margin:0;">
                  Você recebeu este e-mail porque está inscrito no ${eventoConfig.titulo}.
                </p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function generateDripEmailHtml(params: {
  tipo: DripEmailType;
  nomeAluno: string;
  turma: number;
  sala?: string;
  horario?: string;
}) {
  const { tipo, nomeAluno, turma } = params;
  const primeiroNome = nomeAluno.trim().split(/\s+/)[0] ?? nomeAluno;
  const horario =
    params.horario ??
    (turma === 2 ? eventoConfig.horarioTurma2 : eventoConfig.horarioTurma1);
  const sala =
    params.sala ??
    (turma === 1 ? eventoConfig.salaTurma1 : eventoConfig.salaTurma2);
  const localAlocado = `${sala} (${horario})`;

  switch (tipo) {
    case "guia_preparacao":
      return {
        subject: `Como se preparar para o Sábado 1 — ${eventoConfig.titulo}`,
        preheader: `Dicas práticas para você aproveitar 100% da sua imersão em Física e Matemática no Sábado 1.`,
        html: wrapDripLayout({
          title: `Guia de Preparação — ${eventoConfig.titulo}`,
          preheader: `Dicas para o Sábado 1`,
          bodyHtml: `
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding-bottom:12px;">
                  <span style="font-size:11px;font-weight:800;color:#2563eb;letter-spacing:1px;text-transform:uppercase;background-color:#eff6ff;padding:4px 10px;border-radius:12px;display:inline-block;">
                    📚 Pré-Imersão
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:16px;">
                  <h1 style="font-size:22px;line-height:30px;font-weight:800;color:#0f172a;margin:0;">
                    Guia rápido de preparação para o Sábado 1
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="font-size:15px;line-height:24px;color:#334155;padding-bottom:20px;">
                  <p style="margin:0 0 16px 0;">Olá, <strong>${primeiroNome}</strong>!</p>
                  <p style="margin:0 0 16px 0;">
                    Faltam poucos dias para iniciarmos os nossos 4 sábados de imersão. Para você extrair o máximo das aulas com o <strong>Prof. Deuticilam</strong> (Física) e com o <strong>Prof. Juan Carlos</strong> (Matemática), preparamos algumas recomendações essenciais:
                  </p>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;margin-bottom:16px;">
                    <tr>
                      <td style="font-size:14px;line-height:22px;color:#334155;">
                        📌 <strong>Sua Turma:</strong> Turma ${turma} · ${localAlocado}<br />
                        📌 <strong>Caderno exclusivo:</strong> Separe um caderno apenas para as resoluções e anotações do Intensivão.<br />
                        📌 <strong>Apostila física:</strong> Será entregue em mãos no credenciamento logo na sua chegada.
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 16px 0;">
                    Nos vemos no primeiro sábado! Qualquer dúvida, nossa equipe está no WhatsApp.
                  </p>
                </td>
              </tr>
            </table>
          `,
        }),
      };

    case "mensagem_professor":
      return {
        subject: `Uma mensagem pessoal do Prof. Deuticilam — Aprova+`,
        preheader: `Por que a estratégia certa em Física e Matemática define sua vaga em Medicina no Amazonas.`,
        html: wrapDripLayout({
          title: `Mensagem do Prof. Deuticilam`,
          preheader: `Foco na nota de corte de Medicina`,
          bodyHtml: `
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding-bottom:16px;">
                  <h1 style="font-size:22px;line-height:30px;font-weight:800;color:#0f172a;margin:0;">
                    Uma palavra do Prof. Deuticilam
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="font-size:15px;line-height:24px;color:#334155;padding-bottom:20px;">
                  <p style="margin:0 0 16px 0;">Olá, <strong>${primeiroNome}</strong>!</p>
                  <p style="margin:0 0 16px 0;">
                    Sei exatamente o nível de dedicação e cobrança que você enfrenta estudando para Medicina. A nota de corte no Amazonas não perdoa erros bobos nas questões de Natureza e Matemática.
                  </p>
                  <p style="margin:0 0 16px 0;">
                    Por isso, eu e o Prof. Juan Carlos desenhamos cada minuto dos 4 encontros para desconstruir as questões mais complexas, ensinar atalhos de raciocínio e blindar sua prova contra pegadinhas recorrentes.
                  </p>
                  <p style="margin:0 0 16px 0;">
                    Chegue descansado(a) e com a mente aberta para um método direto e sem enrolação.
                  </p>
                  <p style="margin:16px 0 0 0;font-weight:700;color:#0f172a;">
                    — Prof. ${teacher.fullName}<br />
                    <span style="font-size:13px;font-weight:500;color:#64748b;">Mestre em Física · Fundador Aprova+</span>
                  </p>
                </td>
              </tr>
            </table>
          `,
        }),
      };

    case "mapa_tri":
      return {
        subject: `Estratégia de prova para Medicina — erros mais comuns no ENEM`,
        preheader: `Descubra as principais armadilhas de tempo e raciocínio no ENEM.`,
        html: wrapDripLayout({
          title: `Estratégia de Prova — Aprova+`,
          preheader: `Erros mais comuns no ENEM`,
          bodyHtml: `
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding-bottom:16px;">
                  <h1 style="font-size:22px;line-height:30px;font-weight:800;color:#0f172a;margin:0;">
                    Estratégia de prova para Medicina
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="font-size:15px;line-height:24px;color:#334155;padding-bottom:20px;">
                  <p style="margin:0 0 16px 0;">Olá, <strong>${primeiroNome}</strong>!</p>
                  <p style="margin:0 0 16px 0;">
                    Um dos maiores desafios de quem presta Medicina é a administração do tempo e o controle emocional na hora da prova. No ENEM, travar por 10 minutos em uma questão cansativa reduz drasticamente o rendimento e a concentração no restante da prova.
                  </p>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:16px 18px;margin-bottom:16px;">
                    <tr>
                      <td style="font-size:14px;line-height:22px;color:#1e3a8a;">
                        💡 <strong>Regra de Ouro do Intensivão:</strong><br />
                        Garantir a pontuação das questões acessíveis nos primeiros 45 minutos de cada bloco, para então aplicar os métodos rápidos nas questões mais exigentes.
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0;">
                    Vamos treinar essa dinâmica e o ritmo de resolução na prática a cada rodada de exercícios!
                  </p>
                </td>
              </tr>
            </table>
          `,
        }),
      };

    case "checklist_evento":
      return {
        subject: `Checklist para o Sábado 1 — o que levar e como chegar`,
        preheader: `O Sábado 1 é neste sábado! Confira o horário do seu turno e o que levar.`,
        html: wrapDripLayout({
          title: `Checklist do Sábado 1`,
          preheader: `O Sábado 1 é neste sábado!`,
          bodyHtml: `
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding-bottom:12px;">
                  <span style="font-size:11px;font-weight:800;color:#15803d;letter-spacing:1px;text-transform:uppercase;background-color:#dcfce7;padding:4px 10px;border-radius:12px;display:inline-block;">
                    ⏰ É Neste Sábado!
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:16px;">
                  <h1 style="font-size:22px;line-height:30px;font-weight:800;color:#0f172a;margin:0;">
                    Tudo pronto para o Sábado 1?
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="font-size:15px;line-height:24px;color:#334155;padding-bottom:20px;">
                  <p style="margin:0 0 16px 0;">Olá, <strong>${primeiroNome}</strong>!</p>
                  <p style="margin:0 0 16px 0;">
                    Nosso primeiro encontro é neste sábado. Chegue com <strong>15 minutos de antecedência</strong> para fazer seu credenciamento com tranquilidade e pegar sua apostila.
                  </p>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;margin-bottom:16px;">
                    <tr>
                      <td style="font-size:14px;line-height:22px;color:#334155;">
                        📍 <strong>Local:</strong> ${eventoConfig.localNome}<br />
                        🗺️ <strong>Endereço:</strong> ${eventoConfig.localEndereco}<br />
                        🕒 <strong>Seu Horário:</strong> ${horario} (${sala})
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 8px 0;"><strong>O que levar:</strong></p>
                  <p style="margin:0;font-size:14px;color:#475569;">
                    ✔️ Documento oficial com foto<br />
                    ✔️ Caneta esferográfica preta<br />
                    ✔️ Garrafa de água individual
                  </p>
                </td>
              </tr>
            </table>
          `,
        }),
      };

    case "devolutiva_dia1":
      return {
        subject: `Devolutiva do Sábado 1 + metas para o Sábado 2`,
        preheader: `Confira os pontos de atenção do primeiro encontro e o foco do Sábado 2.`,
        html: wrapDripLayout({
          title: `Devolutiva Sábado 1`,
          preheader: `Revisão do Sábado 1`,
          bodyHtml: `
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding-bottom:16px;">
                  <h1 style="font-size:22px;line-height:30px;font-weight:800;color:#0f172a;margin:0;">
                    Excelente trabalho no Sábado 1! 👏
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="font-size:15px;line-height:24px;color:#334155;padding-bottom:20px;">
                  <p style="margin:0 0 16px 0;">Olá, <strong>${primeiroNome}</strong>!</p>
                  <p style="margin:0 0 16px 0;">
                    O ritmo do primeiro dia foi excelente. Já avançamos nos tópicos essenciais e nos padrões recorrentes de prova.
                  </p>
                  <p style="margin:0 0 16px 0;">
                    <strong>Sua meta até o Sábado 2:</strong> Refaça as questões da apostila que você marcou com atenção e revise as resoluções trabalhadas no encontro. No próximo sábado teremos mais uma rodada completa de Física e Matemática!
                  </p>
                </td>
              </tr>
            </table>
          `,
        }),
      };

    case "devolutiva_dia2":
      return {
        subject: `Devolutiva do Sábado 2 + ajustes de reta final`,
        preheader: `Metade do Intensivão concluída! Veja as orientações para o Sábado 3.`,
        html: wrapDripLayout({
          title: `Devolutiva Sábado 2`,
          preheader: `Orientações para o Sábado 3`,
          bodyHtml: `
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding-bottom:16px;">
                  <h1 style="font-size:22px;line-height:30px;font-weight:800;color:#0f172a;margin:0;">
                    Metade da jornada concluída! 🎯
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="font-size:15px;line-height:24px;color:#334155;padding-bottom:20px;">
                  <p style="margin:0 0 16px 0;">Olá, <strong>${primeiroNome}</strong>!</p>
                  <p style="margin:0 0 16px 0;">
                    Você já tem uma base sólida de estratégia de prova. O ritmo de resolução de questões já melhorou visivelmente.
                  </p>
                  <p style="margin:0 0 16px 0;">
                    Para o Sábado 3, revise os pontos trabalhados até aqui e venha com foco total para mais 2h de imersão de Física e Matemática.
                  </p>
                </td>
              </tr>
            </table>
          `,
        }),
      };

    case "devolutiva_dia3":
      return {
        subject: `Devolutiva do Sábado 3 + preparação para o Sábado 4`,
        preheader: `Reta final! Último encontro presencial neste próximo sábado.`,
        html: wrapDripLayout({
          title: `Devolutiva Sábado 3`,
          preheader: `Preparação para o Sábado 4`,
          bodyHtml: `
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding-bottom:16px;">
                  <h1 style="font-size:22px;line-height:30px;font-weight:800;color:#0f172a;margin:0;">
                    Reta final do Intensivão! 🚀
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="font-size:15px;line-height:24px;color:#334155;padding-bottom:20px;">
                  <p style="margin:0 0 16px 0;">Olá, <strong>${primeiroNome}</strong>!</p>
                  <p style="margin:0 0 16px 0;">
                    Chegamos ao último encontro presencial! O Sábado 4 será dedicado à consolidação geral, estratégias de prova e resolução dos modelos de questões mais decisivos para a nota de corte.
                  </p>
                  <p style="margin:0;">
                    Mantenha a consistência: nos vemos no horário habitual (${horario})!
                  </p>
                </td>
              </tr>
            </table>
          `,
        }),
      };

    case "pos_evento":
      return {
        subject: `Certificado de participação — ${eventoConfig.titulo}`,
        preheader: `Obrigado por fazer parte dos 4 sábados! Seu certificado e suporte VIP continuam.`,
        html: wrapDripLayout({
          title: `Certificado e Encerramento`,
          preheader: `Parabéns pela conclusão!`,
          bodyHtml: `
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding-bottom:12px;">
                  <span style="font-size:11px;font-weight:800;color:#b45309;letter-spacing:1px;text-transform:uppercase;background-color:#fef3c7;padding:4px 10px;border-radius:12px;display:inline-block;">
                    🎓 Conclusão de Imersão
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:16px;">
                  <h1 style="font-size:22px;line-height:30px;font-weight:800;color:#0f172a;margin:0;">
                    Parabéns pela dedicação, ${primeiroNome}!
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="font-size:15px;line-height:24px;color:#334155;padding-bottom:20px;">
                  <p style="margin:0 0 16px 0;">
                    O Intensivão presencial terminou, mas a sua jornada até a aprovação em Medicina está mais forte do que nunca.
                  </p>
                  <p style="margin:0 0 16px 0;">
                    Você tem agora todas as ferramentas, fórmulas desmistificadas e o método de resolução rápida de Física e Matemática.
                  </p>
                  <p style="margin:0 0 16px 0;">
                    Desejamos uma excelente reta final de estudos e muito foco no dia da prova. Caso precise de suporte ou queira agendar aulas individuais, nossa equipe continua à disposição no WhatsApp.
                  </p>
                  <table border="0" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                    <tr>
                      <td align="center" style="background-color:#2563eb;border-radius:12px;">
                        <a href="${whatsappUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:14px;color:#ffffff;text-decoration:none;font-weight:700;">
                          Falar com a Equipe no WhatsApp
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `,
        }),
      };
  }
}
