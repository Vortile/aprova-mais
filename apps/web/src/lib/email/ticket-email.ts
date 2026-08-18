import "server-only";

import { Resend } from "resend";
import QRCode from "qrcode";
import type { TableRow } from "@/lib/supabase/typed";
import { evento as eventoConfig } from "@/lib/evento/config";
import { generateTicketEmailHtml } from "./ticket-template";

export { generateTicketEmailHtml } from "./ticket-template";

type Inscricao = TableRow<"evento_inscricoes">;
type EventoDatas = Pick<
  TableRow<"eventos">,
  "data_sabado_1" | "data_sabado_2" | "data_sabado_3" | "data_sabado_4"
>;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não está configurada.");
  }
  return new Resend(apiKey);
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

  const html = generateTicketEmailHtml({ inscricao, evento });

  const response = await resend.emails.send({
    from: "Aprova+ Eventos <contato@aprovamaiscurso-pro.com.br>",
    to: [inscricao.email_aluno],
    subject: `🎟️ Seu Ingresso — ${eventoConfig.titulo}`,
    html,
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
