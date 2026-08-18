"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/data/profile";
import { generateStudentCode, studentEmailFor } from "@/lib/auth/student-code";

type Result = { code: string } | { error: string };

// Crée (ou régénère) l'accès élève d'un enfant : appelée depuis la fiche
// élève (student-detail.tsx) par l'enseignant. Le code retourné n'est
// affiché qu'une seule fois côté UI — il n'est jamais stocké en clair
// (seul son hash vit dans auth.users, via le mot de passe) — à
// l'enseignant de le transmettre tout de suite (bouton WhatsApp).
export async function createStudentAccess(studentId: string): Promise<Result> {
  // Client lié aux cookies de la requête : sert uniquement à vérifier que
  // l'appelant est bien un enseignant autorisé sur cet élève (RLS
  // students_teacher_all) avant de passer au client admin, qui lui
  // contourne totalement la RLS.
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role !== "teacher") {
    return { error: "Non autorisé." };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, full_name, school_id")
    .eq("id", studentId)
    .single();
  if (studentError || !student) {
    return { error: "Élève introuvable." };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("student_id", studentId)
    .eq("role", "student")
    .maybeSingle();

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateStudentCode();
    const email = studentEmailFor(code);

    if (existing) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        email,
        password: code,
        email_confirm: true,
      });
      if (!error) return { code };
      lastError = error.message;
    } else {
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password: code,
        email_confirm: true,
      });
      if (!error && created.user) {
        const { error: profileError } = await admin.from("profiles").insert({
          id: created.user.id,
          role: "student",
          full_name: student.full_name,
          school_id: student.school_id,
          student_id: studentId,
        });
        if (!profileError) return { code };
        // Le compte auth a été créé mais pas le profil applicatif : on le
        // supprime pour ne pas laisser un compte élève orphelin, sans
        // profil, inutilisable et invisible depuis la fiche élève.
        await admin.auth.admin.deleteUser(created.user.id);
        lastError = profileError.message;
      } else {
        lastError = error?.message ?? "Erreur inconnue.";
      }
    }
  }

  return { error: lastError ?? "Échec de la création de l'accès après plusieurs tentatives." };
}
