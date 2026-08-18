import "server-only";

import { Resend } from "resend";
import QRCode from "qrcode";
import type { TableRow } from "@/lib/supabase/typed";
import { evento as eventoConfig } from "@/lib/evento/config";
import { whatsappUrl } from "@/lib/teacher";

type Inscricao = TableRow<"evento_inscricoes">;
type EventoDatas = Pick<
  TableRow<"eventos">,
  "data_sabado_1" | "data_sabado_2" | "data_sabado_3" | "data_sabado_4"
>;

const BRAND_PRIMARY = "#1e535c";
const BRAND_ACCENT = "#854710";
const BRAND_TEXT = "#4b5563";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não está configurada.");
  }
  return new Resend(apiKey);
}

function serieLabel(serie: Inscricao["serie_atual"]) {
  const map: Record<Inscricao["serie_atual"], string> = {
    "1_ano": "1º ano do Ensino Médio",
    "2_ano": "2º ano do Ensino Médio",
    "3_ano": "3º ano do Ensino Médio",
    concluido: "Já concluiu o Ensino Médio",
  };
  return map[serie];
}

function formatDatasEncontros(evento?: EventoDatas | null) {
  if (!evento) return null;

  const datas = [
    evento.data_sabado_1,
    evento.data_sabado_2,
    evento.data_sabado_3,
    evento.data_sabado_4,
  ].filter((data): data is string => Boolean(data));

  if (datas.length === 0) return null;

  return datas
    .map((data) =>
      new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
    )
    .join(" · ");
}

function wrapEmailLayout(title: string, bodyHtml: string) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#fbfbfa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fbfbfa;padding:20px 0;">
      <tr>
        <td align="center">
          <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border:1px solid #eaeaea;border-radius:12px;overflow:hidden;padding:40px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <span style="font-size:24px;font-weight:bold;color:${BRAND_PRIMARY};letter-spacing:-0.5px;">Aprova+</span>
              </td>
            </tr>
            ${bodyHtml}
            <tr>
              <td style="padding-top:30px;">
                <hr style="border:none;border-top:1px solid #eaeaea;margin:0 0 20px 0;" />
                <p style="font-size:11px;line-height:18px;color:#71717a;margin:0;">
                  Você recebeu este e-mail porque se inscreveu no ${eventoConfig.titulo}.<br />
                  <strong>Aprova+ – Aulas particulares com profissionais.</strong> Manaus - AM, Brasil<br />
                  Dúvidas? Fale conosco: ${eventoConfig.localContato}
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

export async function sendTicketEmail(
  inscricao: Inscricao,
  evento?: EventoDatas | null,
) {
  const resend = getResendClient();

  const qrBuffer = await QRCode.toBuffer(inscricao.codigo_ingresso, {
    width: 320,
    margin: 1,
  });
  const qrBase64 = qrBuffer.toString("base64");

  const horario = inscricao.horario_turma ?? eventoConfig.horarioGeral;
  const sala = inscricao.turma_alocada
    ? (inscricao.sala_alocada ?? `Sala ${inscricao.turma_alocada}`)
    : "A confirmar";
  const codigoCurto = inscricao.codigo_ingresso.slice(0, 8).toUpperCase();
  const datasEncontros = formatDatasEncontros(evento);

  const bodyHtml = `
    <tr>
      <td style="padding-bottom:20px;">
        <h1 style="font-size:20px;line-height:28px;color:#111827;margin:0;font-weight:700;">
          🎟️ Ingresso confirmado — ${eventoConfig.titulo}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom:24px;font-size:15px;line-height:24px;color:${BRAND_TEXT};">
        <p style="margin:0 0 16px 0;">Olá, <strong>${inscricao.nome_aluno}</strong>!</p>
        <p style="margin:0 0 16px 0;">
          Seu pagamento de <strong>R$ ${(inscricao.valor_pago_centavos / 100).toFixed(2).replace(".", ",")}</strong> foi confirmado
          e sua vaga no <strong>${eventoConfig.titulo}</strong> está garantida. Guarde este e-mail: ele é o seu ingresso.
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:24px;">
        <img src="cid:ticket-qrcode" alt="QR Code do ingresso" width="200" height="200" style="display:block;border:0;" />
        <p style="font-size:12px;color:#9ca3af;margin:8px 0 0 0;">Código do ingresso: <strong>${codigoCurto}</strong></p>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom:24px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f0;border-radius:12px;padding:20px;">
          <tr>
            <td style="font-size:14px;line-height:22px;color:#111827;">
              <p style="margin:0 0 8px 0;"><strong>Sala:</strong> ${sala} (${horario})</p>
              ${datasEncontros ? `<p style="margin:0 0 8px 0;"><strong>Datas:</strong> ${datasEncontros}</p>` : ""}
              <p style="margin:0 0 8px 0;"><strong>Série informada:</strong> ${serieLabel(inscricao.serie_atual)}</p>
              <p style="margin:0 0 8px 0;"><strong>Local:</strong> ${eventoConfig.localNome}</p>
              <p style="margin:0 0 8px 0;"><strong>Endereço:</strong> ${eventoConfig.localEndereco}</p>
              <p style="margin:0;"><strong>Contato:</strong> ${eventoConfig.localContato}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom:24px;font-size:14px;line-height:22px;color:${BRAND_TEXT};">
        <p style="margin:0 0 8px 0;"><strong>O que levar nos 4 sábados:</strong></p>
        <p style="margin:0;">Documento oficial com foto, caneta preta e uma garrafa de água. O material de apoio é entregue no local.</p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:8px;">
        <table border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="background-color:${BRAND_ACCENT};border-radius:8px;">
              <a href="${whatsappUrl}" target="_blank" style="display:inline-block;padding:14px 30px;font-size:14px;color:#ffffff;text-decoration:none;font-weight:600;">
                Falar no WhatsApp
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  const response = await resend.emails.send({
    from: "Aprova+ Eventos <contato@aprovamaiscurso-pro.com.br>",
    to: [inscricao.email_aluno],
    subject: `🎟️ Seu ingresso — ${eventoConfig.titulo}`,
    html: wrapEmailLayout("Ingresso confirmado", bodyHtml),
    attachments: [
      {
        filename: "ingresso-qrcode.png",
        content: qrBase64,
        contentId: "ticket-qrcode",
        contentType: "image/png",
      },
    ],
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.id ?? null;
}
