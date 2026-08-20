"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/data/profile";

export interface AdminRow {
  id: string;
  fullName: string;
  phone: string | null;
  federationId: string | null;
  federationName: string | null;
  suspended: boolean;
}

// Liste tous les comptes federation_admin du réseau, réservé au
// super_admin (voir profiles_super_admin_read, 0012_admin_management.sql —
// sans cette policy le client scopé de l'appelant ne verrait aucune ligne
// hors la sienne).
export async function listFederationAdmins(): Promise<AdminRow[] | { error: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role !== "super_admin") {
    return { error: "Non autorisé." };
  }

  const { data: admins, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, suspended, federation_id")
    .eq("role", "federation_admin")
    .order("full_name");
  if (error) return { error: error.message };

  const federationIds = [...new Set(admins.map((a) => a.federation_id).filter((id): id is string => id !== null))];
  const { data: federations } = federationIds.length
    ? await supabase.from("federations").select("id, name").in("id", federationIds)
    : { data: [] };
  const nameById = new Map((federations ?? []).map((f) => [f.id, f.name]));

  return admins.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    federationId: row.federation_id,
    federationName: row.federation_id ? (nameById.get(row.federation_id) ?? null) : null,
    suspended: row.suspended,
  }));
}

type Result = { ok: true } | { error: string };

// Suspend ou réactive un compte federation_admin. Le vrai blocage de
// connexion vient de Supabase Auth (ban_duration) — profiles.suspended
// n'est qu'un miroir applicatif pour l'affichage (voir listFederationAdmins
// ci-dessus). "876000h" (~100 ans) est la façon documentée de représenter
// une suspension indéfinie côté Supabase Auth (pas de valeur "infini"
// native) ; "none" lève le blocage.
export async function setAdminSuspended(adminId: string, suspended: boolean): Promise<Result> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role !== "super_admin") {
    return { error: "Non autorisé." };
  }

  const { data: target, error: targetErr } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", adminId)
    .single();
  if (targetErr || !target || target.role !== "federation_admin") {
    return { error: "Compte introuvable ou hors périmètre (federation_admin uniquement)." };
  }

  const admin = createAdminClient();

  const { error: banErr } = await admin.auth.admin.updateUserById(adminId, {
    ban_duration: suspended ? "876000h" : "none",
  });
  if (banErr) return { error: banErr.message };

  const { error: profileErr } = await admin.from("profiles").update({ suspended }).eq("id", adminId);
  if (profileErr) return { error: profileErr.message };

  return { ok: true };
}
