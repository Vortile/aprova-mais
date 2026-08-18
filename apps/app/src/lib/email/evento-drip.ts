import "server-only";

import { Resend } from "resend";
import type { Database } from "@repo/db";

type Inscricao = Database["public"]["Tables"]["evento_inscricoes"]["Row"];
type Evento = Database["public"]["Tables"]["eventos"]["Row"];

export type DripEmailType =
  | "guia_preparacao"
  | "mensagem_professor"
  | "mapa_tri"
  | "checklist_evento"
  | "devolutiva_dia1"
  | "devolutiva_dia2"
  | "devolutiva_dia3"
  | "pos_evento";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não está configurada.");
  }
  return new Resend(apiKey);
}

function wrapEmailLayout(title: string, bodyHtml: string, evento: Evento) {
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
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;table-layout:fixed;">
      <tr>
        <td align="center" style="padding:32px 12px;" class="mobile-container">
          
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
                  ${evento.local_endereco} · Contato: ${evento.local_contato}
                </p>
                <p style="font-size:11px;line-height:16px;color:#94a3b8;margin:0;">
                  Você recebeu este e-mail porque está inscrito no ${evento.titulo}.
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

function paragraph(text: string) {
  return `<p style="margin:0 0 16px 0;">${text}</p>`;
}

function buildContent(
  tipo: DripEmailType,
  inscricao: Inscricao,
  evento: Evento,
): { subject: string; bodyHtml: string } {
  const primeiroNome = inscricao.nome_aluno.split(" ")[0];
  const localAlocado = inscricao.turma_alocada
    ? `${inscricao.sala_alocada ?? `Sala ${inscricao.turma_alocada}`} (${inscricao.horario_turma ?? evento.horario_geral ?? "a confirmar"})`
    : "a confirmar";

  switch (tipo) {
    case "guia_preparacao":
      return {
        subject: `Como se preparar para o Sábado 1 — ${evento.titulo}`,
        bodyHtml: `
          <tr><td style="padding-bottom:16px;"><h1 style="font-size:20px;color:#111827;margin:0;">Guia rápido para o Sábado 1</h1></td></tr>
          <tr><td style="font-size:15px;line-height:24px;color:#4b5563;">
            ${paragraph(`Olá, ${primeiroNome}!`)}
            ${paragraph("Faltam poucas semanas para o primeiro sábado do Intensivão. Separe um caderno só para as anotações do evento e revise os tópicos principais — vamos atacar direto os modelos de questões que mais pesam na nota de corte.")}
            ${paragraph(`Sua sala: ${localAlocado}.`)}
          </td></tr>
        `,
      };
    case "mensagem_professor":
      return {
        subject: `Uma mensagem pessoal do Prof. Deuticilam`,
        bodyHtml: `
          <tr><td style="padding-bottom:16px;"><h1 style="font-size:20px;color:#111827;margin:0;">Uma palavra do Prof. Deuticilam</h1></td></tr>
          <tr><td style="font-size:15px;line-height:24px;color:#4b5563;">
            ${paragraph(`Olá, ${primeiroNome}!`)}
            ${paragraph("Fico muito feliz que você decidiu investir nesses 4 sábados para a sua aprovação em Medicina. Vamos trabalhar juntos, com método e foco total no que realmente importa para a nota de corte.")}
            ${paragraph("Qualquer dúvida antes do evento, é só chamar no WhatsApp.")}
          </td></tr>
        `,
      };
    case "mapa_tri":
      return {
        subject: `Estratégia de prova para Medicina — erros mais comuns no ENEM`,
        bodyHtml: `
          <tr><td style="padding-bottom:16px;"><h1 style="font-size:20px;color:#111827;margin:0;">Estratégia de prova para Medicina</h1></td></tr>
          <tr><td style="font-size:15px;line-height:24px;color:#4b5563;">
            ${paragraph(`Olá, ${primeiroNome}!`)}
            ${paragraph("Antes do nosso encontro, um diagnóstico rápido: a maioria dos candidatos a Medicina perde pontos por administração de tempo e por travar em enunciados longos. No Intensivão vamos treinar exatamente o ritmo de resolução para evitar isso.")}
          </td></tr>
        `,
      };
    case "checklist_evento":
      return {
        subject: `Checklist para o Sábado 1 — o que levar e como chegar`,
        bodyHtml: `
          <tr><td style="padding-bottom:16px;"><h1 style="font-size:20px;color:#111827;margin:0;">Está quase na hora!</h1></td></tr>
          <tr><td style="font-size:15px;line-height:24px;color:#4b5563;">
            ${paragraph(`Olá, ${primeiroNome}!`)}
            ${paragraph(`O Sábado 1 é neste sábado. Chegue com 15 minutos de antecedência no ${evento.local_nome} (${evento.local_endereco}).`)}
            ${paragraph("Leve: documento oficial com foto, caneta preta e uma garrafa de água. O material de apoio é entregue no local.")}
            ${paragraph(`Sua sala: ${localAlocado}.`)}
          </td></tr>
        `,
      };
    case "devolutiva_dia1":
      return {
        subject: `Devolutiva do Sábado 1 + metas para o Sábado 2`,
        bodyHtml: `
          <tr><td style="padding-bottom:16px;"><h1 style="font-size:20px;color:#111827;margin:0;">Como foi o Sábado 1?</h1></td></tr>
          <tr><td style="font-size:15px;line-height:24px;color:#4b5563;">
            ${paragraph(`Olá, ${primeiroNome}!`)}
            ${paragraph("Espero que o primeiro dia tenha sido produtivo. Revise os exercícios da apostila entregue e continue com as metas combinadas até o Sábado 2.")}
          </td></tr>
        `,
      };
    case "devolutiva_dia2":
      return {
        subject: `Devolutiva do Sábado 2 + ajustes de reta final`,
        bodyHtml: `
          <tr><td style="padding-bottom:16px;"><h1 style="font-size:20px;color:#111827;margin:0;">Reta final!</h1></td></tr>
          <tr><td style="font-size:15px;line-height:24px;color:#4b5563;">
            ${paragraph(`Olá, ${primeiroNome}!`)}
            ${paragraph("Estamos avançando em ritmo acelerado. Revise as resoluções e prepare-se para o Sábado 3, com mais uma aula de Física e Matemática.")}
          </td></tr>
        `,
      };
    case "devolutiva_dia3":
      return {
        subject: `Devolutiva do Sábado 3 + preparação para o Sábado 4`,
        bodyHtml: `
          <tr><td style="padding-bottom:16px;"><h1 style="font-size:20px;color:#111827;margin:0;">Último encontro se aproximando</h1></td></tr>
          <tr><td style="font-size:15px;line-height:24px;color:#4b5563;">
            ${paragraph(`Olá, ${primeiroNome}!`)}
            ${paragraph("Revise as anotações e tópicos trabalhados até aqui e prepare-se para o quarto sábado, com mais um encontro de Física e Matemática para consolidar sua preparação.")}
          </td></tr>
        `,
      };
    case "pos_evento":
      return {
        subject: `Certificado de participação — ${evento.titulo}`,
        bodyHtml: `
          <tr><td style="padding-bottom:16px;"><h1 style="font-size:20px;color:#111827;margin:0;">Obrigado por participar!</h1></td></tr>
          <tr><td style="font-size:15px;line-height:24px;color:#4b5563;">
            ${paragraph(`Olá, ${primeiroNome}!`)}
            ${paragraph("O Intensivão chegou ao fim, mas a sua jornada até a aprovação em Medicina está mais forte do que nunca. Conte sempre com a nossa equipe caso precise de suporte ou novas aulas. Boa prova e sucesso na aprovação em Medicina!")}
          </td></tr>
        `,
      };
  }
}

export async function sendDripEmail(
  tipo: DripEmailType,
  inscricao: Inscricao,
  evento: Evento,
) {
  const resend = getResendClient();
  const { subject, bodyHtml } = buildContent(tipo, inscricao, evento);

  const response = await resend.emails.send({
    from: "Aprova+ Eventos <contato@aprovamaiscurso-pro.com.br>",
    to: [inscricao.email_aluno],
    subject,
    html: wrapEmailLayout(subject, bodyHtml, evento),
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.id ?? null;
}
