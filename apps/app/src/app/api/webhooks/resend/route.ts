import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createAdminClient } from "@/lib/supabase/admin";
import { MATERIALS_BUCKET, sanitizeStorageFileName } from "@/lib/materials";
import { asSupabaseInsert } from "@/lib/supabase/typed";

export async function POST(request: Request) {
  const svix_id = request.headers.get("svix-id");
  const svix_timestamp = request.headers.get("svix-timestamp");
  const svix_signature = request.headers.get("svix-signature");

  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (!secret) {
    console.error("Missing RESEND_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  // Get raw body for verification
  const payloadText = await request.text();
  const wh = new Webhook(secret);

  let payload: any;
  try {
    payload = wh.verify(payloadText, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = payload;

  if (type === "email.received") {
    const supabase = createAdminClient();

    const resendEmailId = data.id;
    const fromEmail = data.from || "unknown";
    const toEmails = Array.isArray(data.to) ? data.to : [data.to || "unknown"];
    const ccEmails = Array.isArray(data.cc)
      ? data.cc
      : data.cc
        ? [data.cc]
        : null;
    const bccEmails = Array.isArray(data.bcc)
      ? data.bcc
      : data.bcc
        ? [data.bcc]
        : null;
    const subject = data.subject || "(Sem Assunto)";
    const bodyHtml = data.html || null;
    const bodyText = data.text || null;

    // First insert email record
    const { data: emailRecord, error: emailError } = await supabase
      .from("emails")
      .upsert(
        asSupabaseInsert<"emails">({
          resend_id: resendEmailId,
          direction: "received",
          from_email: fromEmail,
          to_emails: toEmails,
          cc_emails: ccEmails,
          bcc_emails: bccEmails,
          subject: subject,
          body_html: bodyHtml,
          body_text: bodyText,
          status: "received",
          created_at: new Date().toISOString(),
        }),
        { onConflict: "resend_id" },
      )
      .select()
      .single();

    if (emailError) {
      console.error("Error saving email to database:", emailError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const emailId = (emailRecord as any).id;

    // Handle attachments if any
    const attachments = data.attachments || [];
    for (const att of attachments) {
      try {
        // Fetch details from Resend to get the time-limited download URL
        const detailsRes = await fetch(
          `https://api.resend.com/emails/received/${resendEmailId}/attachments/${att.id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
          },
        );

        if (!detailsRes.ok) {
          console.error(`Failed to get attachment details for ${att.id}`);
          continue;
        }

        const details = await detailsRes.json();
        const downloadUrl = details.download_url;

        if (!downloadUrl) {
          console.error(`No download_url found for attachment ${att.id}`);
          continue;
        }

        // Download attachment content
        const fileRes = await fetch(downloadUrl);
        if (!fileRes.ok) {
          console.error(`Failed to download attachment ${att.id} from Resend`);
          continue;
        }

        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const filename = att.name || "attachment";
        const fileExtension = filename.includes(".")
          ? filename.slice(filename.lastIndexOf("."))
          : "";
        const baseName = fileExtension
          ? filename.slice(0, -fileExtension.length)
          : filename;
        const safeName = `${Date.now()}-${crypto.randomUUID()}-${sanitizeStorageFileName(baseName)}${fileExtension.toLowerCase()}`;
        const storagePath = `emails/${emailId}/${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(MATERIALS_BUCKET)
          .upload(storagePath, buffer, {
            contentType:
              fileRes.headers.get("content-type") || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error(
            `Error uploading attachment ${filename} to storage:`,
            uploadError,
          );
          continue;
        }

        // Save attachment record in the DB
        const { error: dbAttachError } = await supabase
          .from("email_attachments")
          .insert(
            asSupabaseInsert<"email_attachments">({
              email_id: emailId,
              resend_attachment_id: att.id,
              filename: filename,
              content_type:
                fileRes.headers.get("content-type") ||
                "application/octet-stream",
              size: att.size || null,
              storage_path: storagePath,
            }),
          );

        if (dbAttachError) {
          console.error(
            `Error saving attachment metadata to DB:`,
            dbAttachError,
          );
        }
      } catch (err) {
        console.error(`Error processing attachment ${att.id}:`, err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
