"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/data/profile";
import { generateTempPassword } from "@/lib/auth/temp-password";

type Result = { email: string; password: string } | { error: string };

// Crée un compte enseignant (e-mail + mot de passe réel, à la différence du
// code élève) pour une école donnée — appelée par un federation_admin (pour
// une école de SA fédération) ou un super_admin (n'importe quelle école).
// Le mot de passe temporaire n'est affiché qu'une seule fois côté UI, à
// transmettre par l'admin (WhatsApp/oral) ; l'enseignant peut le changer
// depuis son profil une fois connecté (pas encore d'écran dédié, TODO futur).
export async function createTeacherAccount(input: {
  schoolId: string;
  fullName: string;
  email: string;
  phone?: string;
}): Promise<Result> {
  // Client lié aux cookies de la requête : sert à vérifier que l'appelant a
  // bien le droit (RLS schools_read / schools_super_admin_read) de voir
  // cette école avant de passer au client admin, qui lui contourne
  // totalement la RLS. C'est ce qui applique la frontière "un
  // federation_admin ne peut créer un enseignant que pour une école de sa
  // propre fédération" sans avoir à la recoder à la main ici.
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "federation_admin" && profile.role !== "super_admin")) {
    return { error: "Non autorisé." };
  }

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (!fullName) return { error: "Nom complet requis." };
  if (!email || !email.includes("@")) return { error: "E-mail invalide." };

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id")
    .eq("id", input.schoolId)
    .single();
  if (schoolError || !school) {
    return { error: "École introuvable ou hors de votre périmètre." };
  }

  const admin = createAdminClient();
  const password = generateTempPassword();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    return { error: createErr?.message ?? "Échec de la création du compte." };
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    role: "teacher",
    full_name: fullName,
    phone: input.phone?.trim() || null,
    school_id: input.schoolId,
  });
  if (profileErr) {
    // Le compte auth a été créé mais pas le profil applicatif : on le
    // supprime pour ne pas laisser un compte enseignant orphelin, sans
    // profil, inutilisable et invisible.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: profileErr.message };
  }

  return { email, password };
}
