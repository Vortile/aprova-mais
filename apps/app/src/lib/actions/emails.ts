"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/supabase/env";
import { MATERIALS_BUCKET } from "@/lib/materials";
import { asSupabaseInsert } from "@/lib/supabase/typed";
import fs from "fs";
import path from "path";

// Initialize Resend
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }
  return new Resend(apiKey);
};

export type EmailWithAttachments = {
  id: string;
  resend_id: string | null;
  direction: "received" | "sent";
  from_email: string;
  to_emails: string[];
  cc_emails: string[] | null;
  bcc_emails: string[] | null;
  subject: string | null;
  body_html: string | null;
  body_text: string | null;
  status: string;
  created_at: string;
  email_attachments: {
    id: string;
    email_id: string;
    resend_attachment_id: string | null;
    filename: string;
    content_type: string | null;
    size: number | null;
    storage_path: string;
    created_at: string;
  }[];
};

/**
 * Asserts the current user has ADMIN role.
 */
async function assertAdminSession() {
  const session = await getCurrentAppSession();
  if (!session || session.profile.role !== ROLES.ADMIN) {
    throw new Error(
      "Acesso negado. Apenas administradores podem gerenciar e-mails.",
    );
  }
  return session;
}

/**
 * Fetch list of emails (received or sent) from database.
 */
export async function getEmailsAction(
  direction?: "received" | "sent",
): Promise<EmailWithAttachments[]> {
  await assertAdminSession();
  const supabase = createAdminClient();

  let query = supabase
    .from("emails")
    .select(
      `
      *,
      email_attachments (
        id,
        email_id,
        resend_attachment_id,
        filename,
        content_type,
        size,
        storage_path,
        created_at
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (direction) {
    query = query.eq("direction", direction);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching emails:", error);
    throw new Error("Não foi possível buscar os e-mails.");
  }

  return (data as any) || [];
}

/**
 * Send an email via Resend and save to database.
 * Includes email deliverability best practices (CAN-SPAM compliant footers,
 * clean plaintext fallbacks, and customizable Reply-To headers to lower spam scores).
 */
export async function sendEmailAction(formData: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await assertAdminSession();
    const resend = getResendClient();
    const supabase = createAdminClient();

    const toAddresses = formData.to
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (toAddresses.length === 0) {
      return { ok: false, error: "E-mail do destinatário inválido." };
    }

    const defaultFrom = "contato@aprovamaiscurso-pro.com.br";
    const sender = formData.from || defaultFrom;

    // Check if the administrator placed a custom footer image in the public folder
    const footerImagePath = path.join(
      process.cwd(),
      "public",
      "email-footer.jpg",
    );
    let hasInlineFooter = false;
    let base64Footer = "";

    try {
      if (fs.existsSync(footerImagePath)) {
        base64Footer = fs.readFileSync(footerImagePath, { encoding: "base64" });
        hasInlineFooter = true;
      }
    } catch (err) {
      console.error("Error reading inline email-footer.jpg:", err);
    }

    // Standard high-trust CAN-SPAM compliant footers
    // If the JPG is present, we render it directly. Otherwise, we fall back to a beautifully formatted HTML text footer.
    const footerContent = hasInlineFooter
      ? `
      <div style="max-width:600px;margin:0 auto;text-align:center;">
        <img src="cid:email-footer" alt="Aprova+ – Aulas particulares com profissionais. Manaus - AM, Brasil." width="600" style="display:block;border:0;width:100%;max-width:600px;height:auto;" />
      </div>
    `
      : `
      <hr style="border:none;border-top:1px solid #eaeaea;margin:20px 0;" />
      <p style="font-size:11px;line-height:18px;color:#71717a;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;text-align:left;">
        Este é um e-mail enviado automaticamente pela plataforma <strong>Aprova+</strong>.
        <br />
        Você recebeu esta mensagem porque está cadastrado como aluno, responsável ou professor no sistema Aprova+.
        <br /><br />
        <strong>Aprova+ – Aulas particulares com profissionais.</strong><br />
        Manaus - AM, Brasil<br />
        Caso queira parar de receber estes comunicados ou cancelar seu cadastro, entre em contato em: <a href="mailto:contato@aprovamaiscurso-pro.com.br" style="color:#2563eb;text-decoration:underline;">contato@aprovamaiscurso-pro.com.br</a>.
      </p>
    `;

    const complianceFooterText = `
--
Este é um e-mail enviado automaticamente pela plataforma Aprova+.
Você recebeu esta mensagem porque está cadastrado como aluno, responsável ou professor no sistema Aprova+.

Aprova+ – Aulas particulares com profissionais.
Manaus - AM, Brasil
Caso queira parar de receber estes comunicados ou cancelar seu cadastro, entre em contato em: contato@aprovamaiscurso-pro.com.br
`;

    // Append footers to make emails more trustable and compliance-safe
    let finalHtml = formData.html;
    if (!formData.html.includes("aprovamaiscurso-pro.com.br")) {
      const lowercaseHtml = formData.html.toLowerCase();
      const lastTableIndex = lowercaseHtml.lastIndexOf("</table>");

      if (lastTableIndex !== -1) {
        // It's a table-based layout. Let's insert the footer as a table row inside the outer table.
        const footerTableRow = `
          <tr>
            <td align="center" style="padding-top:20px;">
              ${footerContent}
            </td>
          </tr>
        `;
        finalHtml =
          formData.html.substring(0, lastTableIndex) +
          footerTableRow +
          formData.html.substring(lastTableIndex);
      } else {
        // No tables found. Let's insert before </body> or append.
        const bodyCloseIndex = lowercaseHtml.lastIndexOf("</body>");
        const fallbackFooter = `
          <br><br>
          ${footerContent}
        `;
        if (bodyCloseIndex !== -1) {
          finalHtml =
            formData.html.substring(0, bodyCloseIndex) +
            fallbackFooter +
            formData.html.substring(bodyCloseIndex);
        } else {
          const htmlCloseIndex = lowercaseHtml.lastIndexOf("</html>");
          if (htmlCloseIndex !== -1) {
            finalHtml =
              formData.html.substring(0, htmlCloseIndex) +
              fallbackFooter +
              formData.html.substring(htmlCloseIndex);
          } else {
            finalHtml = `${formData.html}${fallbackFooter}`;
          }
        }
      }
    }

    const strippedText = formData.html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const finalPlainText = `${strippedText}\n\n${complianceFooterText}`;

    // Set replyTo parameter. High-deliverability practice:
    // If receiving is disabled on the primary domain subdomain, pointing replyTo to a valid,
    // monitored email inbox boosts deliverability significantly as ESPs verify reply inbox responsiveness.
    const replyToAddress = formData.replyTo?.trim() || sender;

    // Build attachments array
    const emailAttachments: any[] = [];
    if (hasInlineFooter) {
      emailAttachments.push({
        filename: "email-footer.jpg",
        content: base64Footer,
        contentId: "email-footer",
        contentType: "image/jpeg",
        disposition: "inline",
      });
    }

    // Dynamic banner checks based on cid reference within the HTML
    if (finalHtml.includes("cid:email-banner-welcome")) {
      const bannerPath = path.join(
        process.cwd(),
        "public",
        "email-banner-welcome.jpg",
      );
      if (fs.existsSync(bannerPath)) {
        const base64Banner = fs.readFileSync(bannerPath, {
          encoding: "base64",
        });
        emailAttachments.push({
          filename: "email-banner-welcome.jpg",
          content: base64Banner,
          contentId: "email-banner-welcome",
          contentType: "image/jpeg",
          disposition: "inline",
        });
      }
    }

    if (finalHtml.includes("cid:email-banner-hi")) {
      const bannerPath = path.join(
        process.cwd(),
        "public",
        "email-banner-hi.jpg",
      );
      if (fs.existsSync(bannerPath)) {
        const base64Banner = fs.readFileSync(bannerPath, {
          encoding: "base64",
        });
        emailAttachments.push({
          filename: "email-banner-hi.jpg",
          content: base64Banner,
          contentId: "email-banner-hi",
          contentType: "image/jpeg",
          disposition: "inline",
        });
      }
    }

    // Send via Resend SDK
    const response = await resend.emails.send({
      from: `Aprova+ <${sender}>`,
      to: toAddresses,
      subject: formData.subject,
      html: finalHtml,
      text: finalPlainText,
      replyTo: replyToAddress,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
    });

    if (response.error) {
      console.error("Resend send error:", response.error);
      return { ok: false, error: response.error.message };
    }

    const resendId = response.data?.id || null;

    // Save to our DB as a sent email
    const { data: emailRecord, error: dbError } = await supabase
      .from("emails")
      .insert(
        asSupabaseInsert<"emails">({
          resend_id: resendId,
          direction: "sent",
          from_email: sender,
          to_emails: toAddresses,
          subject: formData.subject,
          body_html: finalHtml,
          body_text: finalPlainText,
          status: "sent",
          created_at: new Date().toISOString(),
        }),
      )
      .select()
      .single();

    if (dbError) {
      console.error("Error saving sent email to DB:", dbError);
    }

    revalidatePath("/admin/emails");

    return { ok: true, id: (emailRecord as any)?.id || "" };
  } catch (err: any) {
    console.error("sendEmailAction exception:", err);
    return {
      ok: false,
      error: err.message || "Erro interno ao enviar e-mail.",
    };
  }
}

/**
 * Generates a signed download URL for an email attachment.
 */
export async function getAttachmentDownloadUrlAction(
  storagePath: string,
): Promise<string | null> {
  try {
    await assertAdminSession();
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from(MATERIALS_BUCKET)
      .createSignedUrl(storagePath, 60 * 60); // 1 hour validity

    if (error) {
      console.error("Error creating signed URL for email attachment:", error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("getAttachmentDownloadUrlAction exception:", err);
    return null;
  }
}
