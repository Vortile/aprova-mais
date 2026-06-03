import type { Metadata } from "next";
import { getMaterialDownloadUrl } from "@/lib/materials";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/supabase/env";
import { MateriaisClient } from "./materiais-client";
import type { TableRow } from "@/lib/supabase/typed";
import { TABLES } from "@repo/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Materiais | Admin" };

export default async function MateriaisPage() {
  const session = await getCurrentAppSession();
  const supabase = createAdminClient();
  const isAdmin = session?.profile.role === ROLES.ADMIN;

  let materiaisQuery = supabase
    .from(TABLES.MATERIAIS)
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin && session) {
    materiaisQuery = materiaisQuery.eq("uploaded_by", session.profile.id);
  }

  // Fetch alunos scoped to this staff member
  let alunosQuery = supabase
    .from(TABLES.ALUNOS)
    .select("id, contact_email, profiles!alunos_profile_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (!isAdmin && session) {
    alunosQuery = alunosQuery.eq("professor_id", session.profile.id);
  }

  const [{ data: materiais }, { data: alunos }] = await Promise.all([
    materiaisQuery,
    alunosQuery,
  ]);

  const materialIds = ((materiais ?? []) as TableRow<"materiais">[]).map(
    (m) => m.id,
  );

  // Fetch existing assignments for visible materials
  let assignmentsByMaterial: Record<string, string[]> = {};

  if (materialIds.length > 0) {
    const { data: assignments } = await supabase
      .from(TABLES.ALUNO_MATERIAIS)
      .select("material_id, aluno_id")
      .in("material_id", materialIds);

    for (const row of assignments ?? []) {
      const r = row as { material_id: string; aluno_id: string };
      if (!assignmentsByMaterial[r.material_id]) {
        assignmentsByMaterial[r.material_id] = [];
      }
      assignmentsByMaterial[r.material_id].push(r.aluno_id);
    }
  }

  // Collect unique uploader profile IDs for name lookup
  const uploaderIds = [
    ...new Set(
      ((materiais ?? []) as TableRow<"materiais">[])
        .map((m) => m.uploaded_by)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const uploaderNames: Record<string, string | null> = {};

  if (uploaderIds.length > 0) {
    const { data: profiles } = await supabase
      .from(TABLES.PROFILES)
      .select("id, full_name")
      .in("id", uploaderIds);

    for (const profile of profiles ?? []) {
      const p = profile as { id: string; full_name: string | null };
      uploaderNames[p.id] = p.full_name;
    }
  }

  const materiaisWithMeta = await Promise.all(
    ((materiais ?? []) as TableRow<"materiais">[]).map(async (material) => ({
      ...material,
      download_url: await getMaterialDownloadUrl(material.file_url),
      uploader_name: material.uploaded_by
        ? (uploaderNames[material.uploaded_by] ?? null)
        : null,
    })),
  );

  const alunosList = (alunos ?? []).map((a) => {
    const row = a as {
      id: string;
      contact_email: string | null;
      profiles: { full_name: string | null } | null;
    };
    return {
      id: row.id,
      name: row.profiles?.full_name ?? row.contact_email ?? row.id,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Materiais</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdmin
            ? "Veja e gerencie todos os materiais de estudo."
            : "Faça upload e organize seus materiais de estudo."}
        </p>
      </div>
      <MateriaisClient
        materiais={materiaisWithMeta}
        isAdmin={isAdmin ?? false}
        alunos={alunosList}
        assignmentsByMaterial={assignmentsByMaterial}
      />
    </div>
  );
}
