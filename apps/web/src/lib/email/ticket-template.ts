import { evento as eventoConfig } from "@/lib/evento/config";
import { whatsappUrl, teacher, guestTeacher } from "@/lib/teacher";
import type { TableRow } from "@/lib/supabase/typed";

type Inscricao = TableRow<"evento_inscricoes">;
type EventoDatas = Pick<
  TableRow<"eventos">,
  "data_sabado_1" | "data_sabado_2" | "data_sabado_3" | "data_sabado_4"
>;

export function serieLabel(serie: Inscricao["serie_atual"]) {
  const map: Record<Inscricao["serie_atual"], string> = {
    "1_ano": "1º ano do Ensino Médio",
    "2_ano": "2º ano do Ensino Médio",
    "3_ano": "3º ano do Ensino Médio",
    concluido: "Já concluiu o Ensino Médio",
  };
  return map[serie];
}

export function formatDatasEncontros(evento?: EventoDatas | null) {
  if (!evento) return "12/09 · 19/09 · 26/09 · 03/10";

  const datas = [
    evento.data_sabado_1,
    evento.data_sabado_2,
    evento.data_sabado_3,
    evento.data_sabado_4,
  ].filter((data): data is string => Boolean(data));

  if (datas.length === 0) return "12/09 · 19/09 · 26/09 · 03/10";

  return datas
    .map((data) =>
      new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
    )
    .join(" · ");
}

export function generateTicketEmailHtml(params: {
  inscricao: Inscricao;
  evento?: EventoDatas | null;
}) {
  const { inscricao, evento } = params;
  const valorFormatado = (inscricao.valor_pago_centavos / 100)
    .toFixed(2)
    .replace(".", ",");
  const horario =
    inscricao.horario_turma ??
    (inscricao.turma_alocada === 2
      ? eventoConfig.horarioTurma2
      : eventoConfig.horarioTurma1);
  const turmaNumero = inscricao.turma_alocada ?? 1;
  const sala =
    inscricao.sala_alocada ??
    (turmaNumero === 1 ? eventoConfig.salaTurma1 : eventoConfig.salaTurma2);
  const codigoCurto = inscricao.codigo_ingresso.slice(0, 8).toUpperCase();
  const datasEncontros = formatDatasEncontros(evento);
  const primeiroNome =
    inscricao.nome_aluno.trim().split(/\s+/)[0] ?? inscricao.nome_aluno;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>🎟️ Ingresso Confirmado — ${eventoConfig.titulo}</title>
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
        .mobile-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
        .mobile-stack-cell { padding-bottom: 12px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#0f172a;">
    
    <!-- Preheader preview text for mail clients -->
    <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      Seu pagamento de R$ ${valorFormatado} foi confirmado! Veja seu QR Code, sala (${sala}) e horário da Turma ${turmaNumero} para os 4 sábados.
    </div>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;table-layout:fixed;">
      <tr>
        <td align="center" style="padding:32px 12px;" class="mobile-container">
          
          <!-- Outer 600px Max Card -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:24px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 25px -5px rgba(15, 23, 42, 0.08);">
            
            <!-- Brand Top Header -->
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

            <!-- Card Content Body -->
            <tr>
              <td style="padding:36px 32px 28px 32px;" class="mobile-card">
                
                <!-- Status Badge & Greeting -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding-bottom:12px;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color:#dcfce7;border:1px solid #86efac;border-radius:20px;padding:6px 14px;">
                            <span style="font-size:12px;font-weight:700;color:#15803d;letter-spacing:0.5px;text-transform:uppercase;">
                              ● Pagamento Confirmado · Vaga Garantida
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:16px;">
                      <h1 style="font-size:24px;line-height:32px;font-weight:800;color:#0f172a;margin:0;letter-spacing:-0.5px;">
                        Tudo pronto, ${primeiroNome}! 🎉
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:28px;font-size:15px;line-height:24px;color:#334155;">
                      <p style="margin:0 0 12px 0;">
                        Seu pagamento de <strong>R$ ${valorFormatado}</strong> foi aprovado com sucesso. Sua vaga no <strong>${eventoConfig.titulo}</strong> está 100% reservada.
                      </p>
                      <p style="margin:0;color:#64748b;font-size:14px;">
                        Guarde este e-mail. Ele é o seu ingresso oficial para os 4 sábados de imersão presencial.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- ── THE DIGITAL BOARDING PASS / TICKET ── -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:2px solid #cbd5e1;border-radius:18px;overflow:hidden;margin-bottom:28px;">
                  
                  <!-- Ticket Header Banner -->
                  <tr>
                    <td style="background-color:#1e40af;padding:16px 20px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="left">
                            <span style="font-size:12px;font-weight:800;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">
                              Passaporte de Acesso Oficial
                            </span>
                          </td>
                          <td align="right">
                            <span style="background-color:#3b82f6;color:#ffffff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:12px;text-transform:uppercase;letter-spacing:0.5px;">
                              Turma ${turmaNumero}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Ticket Details Grid -->
                  <tr>
                    <td style="padding:20px 20px 16px 20px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td width="50%" valign="top" style="padding-bottom:14px;" class="mobile-stack mobile-stack-cell">
                            <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Turno / Horário</span>
                            <div style="font-size:15px;font-weight:700;color:#0f172a;margin-top:2px;">${horario}</div>
                          </td>
                          <td width="50%" valign="top" style="padding-bottom:14px;" class="mobile-stack">
                            <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Sala Alocada</span>
                            <div style="font-size:15px;font-weight:700;color:#1e40af;margin-top:2px;">${sala}</div>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" valign="top" style="padding-bottom:14px;" class="mobile-stack mobile-stack-cell">
                            <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Datas dos 4 Sábados</span>
                            <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:2px;">${datasEncontros}</div>
                          </td>
                          <td width="50%" valign="top" style="padding-bottom:14px;" class="mobile-stack">
                            <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Série Cadastrada</span>
                            <div style="font-size:14px;font-weight:600;color:#0f172a;margin-top:2px;">${serieLabel(inscricao.serie_atual)}</div>
                          </td>
                        </tr>
                        <tr>
                          <td colspan="2" valign="top" style="padding-top:4px;border-top:1px solid #e2e8f0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:10px;">
                              <tr>
                                <td>
                                  <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Local do Evento</span>
                                  <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:2px;">${eventoConfig.localNome}</div>
                                  <div style="font-size:13px;color:#475569;margin-top:2px;line-height:18px;">${eventoConfig.localEndereco}</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Perforated Ticket Divider -->
                  <tr>
                    <td style="padding:0 12px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="border-top:2px dashed #cbd5e1;height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Ticket QR Code Section -->
                  <tr>
                    <td align="center" style="padding:24px 20px 24px 20px;background-color:#f1f5f9;">
                      <table border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #cbd5e1;border-radius:16px;padding:16px;box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                        <tr>
                          <td align="center">
                            <img src="cid:ticket-qrcode" alt="QR Code do Ingresso" width="200" height="200" style="display:block;border-radius:8px;border:0;" />
                          </td>
                        </tr>
                      </table>
                      <div style="margin-top:12px;">
                        <span style="display:inline-block;background-color:#e2e8f0;color:#334155;font-size:12px;font-weight:800;letter-spacing:1px;padding:4px 12px;border-radius:8px;font-family:monospace;">
                          ID: #${codigoCurto}
                        </span>
                      </div>
                      <p style="font-size:12px;font-weight:600;color:#64748b;margin:8px 0 0 0;">
                        Apresente este QR Code no credenciamento ao chegar
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- ── CORPO DOCENTE ── -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:18px 20px;margin-bottom:24px;">
                  <tr>
                    <td>
                      <span style="font-size:11px;font-weight:800;color:#1d4ed8;letter-spacing:1px;text-transform:uppercase;">
                        Mentores Especialistas que vão te guiar
                      </span>
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:8px;">
                        <tr>
                          <td style="font-size:13px;line-height:20px;color:#1e3a8a;">
                            • <strong>Prof. ${teacher.fullName}</strong> — Física · Mestre pela UFAM<br />
                            • <strong>Prof. ${guestTeacher.fullName}</strong> — Matemática · UEA
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- ── O QUE LEVAR NOS 4 SÁBADOS ── -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:32px;">
                  <tr>
                    <td style="padding-bottom:8px;">
                      <span style="font-size:13px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">
                        📋 O que levar nos 4 sábados:
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;line-height:22px;color:#334155;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr><td style="padding:2px 0;">✔️ <strong>Documento oficial com foto</strong> (RG, CNH ou Passaporte)</td></tr>
                        <tr><td style="padding:2px 0;">✔️ <strong>Caneta esferográfica preta</strong> de tubo transparente</td></tr>
                        <tr><td style="padding:2px 0;">✔️ <strong>Garrafa de água individual</strong></td></tr>
                        <tr><td style="padding:2px 0;color:#64748b;font-size:12px;">* A apostila física com gabaritos comentados será entregue no local.</td></tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- ── WHATSAPP CTA ── -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="background-color:#2563eb;border-radius:12px;box-shadow:0 4px 12px rgba(37, 99, 235, 0.3);">
                            <a href="${whatsappUrl}" target="_blank" style="display:inline-block;padding:16px 36px;font-size:15px;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                              💬 Falar com a Equipe no WhatsApp
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="font-size:12px;color:#94a3b8;margin:12px 0 0 0;">
                        Dúvidas sobre o local ou cronograma? Nossa equipe está à disposição.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- ── FOOTER ── -->
            <tr>
              <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 32px;text-align:center;">
                <p style="font-size:12px;line-height:20px;color:#64748b;margin:0 0 8px 0;">
                  <strong>Aprova+ – Aulas Particulares &amp; Preparação com Profissionais</strong><br />
                  ${eventoConfig.localEndereco} · Contato: ${eventoConfig.localContato}
                </p>
                <p style="font-size:11px;line-height:16px;color:#94a3b8;margin:0;">
                  Você recebeu este e-mail transacional porque confirmou sua vaga no ${eventoConfig.titulo}.
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
