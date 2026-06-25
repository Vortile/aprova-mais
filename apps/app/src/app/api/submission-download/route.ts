import { NextResponse } from "next/server";
import { getCurrentAppSession } from "@/lib/auth/session";
import { getMaterialDownloadUrl } from "@/lib/materials";

export async function GET(request: Request) {
  const session = await getCurrentAppSession();

  if (!session) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Caminho do arquivo não fornecido." },
      { status: 400 },
    );
  }

  // Generate a signed URL valid for 1 hour using our lib
  const signedUrl = await getMaterialDownloadUrl(path);

  if (!signedUrl) {
    return NextResponse.json(
      { error: "Não foi possível gerar a URL de download." },
      { status: 500 },
    );
  }

  // Redirect the user to the safe signed URL on Supabase Storage
  return NextResponse.redirect(signedUrl);
}
