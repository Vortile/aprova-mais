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
  | "pos_evento";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não está configurada.");
  }
  return new Resend(apiKey);
}

function wrapEmailLayout(bodyHtml: string, evento: Evento) {
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#fbfbfa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fbfbfa;padding:20px 0;">
      <tr>
        <td align="center">
          <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border:1px solid #eaeaea;border-radius:12px;overflow:hidden;padding:40px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <span style="font-size:24px;font-weight:bold;color:#1e535c;letter-spacing:-0.5px;">Aprova+</span>
              </td>
            </tr>
            ${bodyHtml}
            <tr>
              <td style="padding-top:30px;">
                <hr style="border:none;border-top:1px solid #eaeaea;margin:0 0 20px 0;" />
                <p style="font-size:11px;line-height:18px;color:#71717a;margin:0;">
                  Você recebeu este e-mail porque se inscreveu no ${evento.titulo}.<br />
                  <strong>Aprova+ – Aulas particulares com profissionais.</strong> Manaus - AM, Brasil<br />
                  Dúvidas? Fale conosco: ${evento.local_contato}
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
            ${paragraph("Faltam poucas semanas para o primeiro sábado do Intensivão. Separe um caderno só para as anotações do evento e revise por alto os principais tópicos de Ciências da Natureza — vamos atacar direto os pontos que mais pesam na TRI.")}
            ${paragraph(`Sua sala: ${localAlocado}.`)}
          </td></tr>
        `,
      };
    case "mensagem_professor":
      return {
        subject: `Uma mensagem pessoal do Prof. Júnior`,
        bodyHtml: `
          <tr><td style="padding-bottom:16px;"><h1 style="font-size:20px;color:#111827;margin:0;">Uma palavra do Prof. Júnior</h1></td></tr>
          <tr><td style="font-size:15px;line-height:24px;color:#4b5563;">
            ${paragraph(`Olá, ${primeiroNome}!`)}
            ${paragraph("Fico muito feliz que você decidiu investir nesses 3 sábados para a sua aprovação em Medicina. Vamos trabalhar juntos, com método e foco total no que realmente importa para a nota de corte.")}
            ${paragraph("Qualquer dúvida antes do evento, é só chamar no WhatsApp.")}
          </td></tr>
        `,
      };
    case "mapa_tri":
      return {
        subject: `O mapa da TRI de Medicina — erros mais comuns no ENEM`,
        bodyHtml: `
          <tr><td style="padding-bottom:16px;"><h1 style="font-size:20px;color:#111827;margin:0;">O mapa da TRI de Medicina</h1></td></tr>
          <tr><td style="font-size:15px;line-height:24px;color:#4b5563;">
            ${paragraph(`Olá, ${primeiroNome}!`)}
            ${paragraph("Antes do nosso encontro, um diagnóstico rápido: a maioria dos candidatos a Medicina perde pontos por administração de tempo e por confiar em questões de baixa discriminação. No Intensivão vamos treinar exatamente para evitar isso.")}
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
            ${paragraph("Espero que o primeiro dia tenha sido produtivo. Revise os gabaritos comentados que entregamos e continue com o plano de estudos combinado até o Sábado 2.")}
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
            ${paragraph("Estamos quase lá. Ajuste seu plano de revisão para o Sábado 3 com foco em redação e simulado — é o nosso último encontro antes do ENEM.")}
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
            ${paragraph("O Intensivão chegou ao fim, mas o nosso acompanhamento continua. Conte com o grupo VIP no WhatsApp até o dia do ENEM. Boa prova e sucesso na aprovação em Medicina!")}
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
    html: wrapEmailLayout(bodyHtml, evento),
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.id ?? null;
}
