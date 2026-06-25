import { NextResponse } from "next/server";
import { getCurrentAppSession } from "@/lib/auth/session";
import { MATERIALS_BUCKET, sanitizeStorageFileName } from "@/lib/materials";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const session = await getCurrentAppSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Sessão inválida." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Selecione um arquivo válido." },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { ok: false, error: "O arquivo está vazio." },
      { status: 400 },
    );
  }

  // Limit size to 15MB per file
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json(
      {
        ok: false,
        error: "Arquivo muito grande. O limite é de 15MB por arquivo.",
      },
      { status: 400 },
    );
  }

  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : "";
  const baseName = extension
    ? file.name.slice(0, -extension.length)
    : file.name;
  const safeName = `${Date.now()}-${crypto.randomUUID()}-${sanitizeStorageFileName(baseName)}${extension.toLowerCase()}`;

  // Save under entregas/
  const path = `entregas/${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await createAdminClient()
    .storage.from(MATERIALS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    console.error("[SubmissionUpload]", error);
    return NextResponse.json(
      { ok: false, error: "Não foi possível enviar o arquivo para o Storage." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, path });
}
