"use server";

import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getMyClass } from "@/lib/data/classes";

type TokenResult = { token: string; url: string } | { error: string };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquant (.env.local) — requis pour l'audio en direct.`);
  return value;
}

// Jeton d'émission : seul l'enseignant titulaire de la classe peut publier
// de l'audio dans sa propre room (room = class_id).
export async function getTeacherAudioToken(classId: string): Promise<TokenResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role !== "teacher") return { error: "Non autorisé." };

  const myClass = await getMyClass(supabase);
  if (!myClass || myClass.id !== classId) return { error: "Non autorisé." };

  return mintToken(classId, `enseignant-${profile.id}`, { canPublish: true, canSubscribe: false });
}

// Jeton d'écoute : seul un élève de la classe peut rejoindre sa room en
// tant qu'auditeur (jamais en publication).
export async function getStudentAudioToken(classId: string): Promise<TokenResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role !== "student" || !profile.student_id) return { error: "Non autorisé." };

  const { data: student } = await supabase
    .from("students")
    .select("class_id")
    .eq("id", profile.student_id)
    .maybeSingle();
  if (!student || student.class_id !== classId) return { error: "Non autorisé." };

  return mintToken(classId, `eleve-${profile.student_id}`, { canPublish: false, canSubscribe: true });
}

async function mintToken(
  classId: string,
  identity: string,
  grants: { canPublish: boolean; canSubscribe: boolean },
): Promise<TokenResult> {
  try {
    const apiKey = requireEnv("LIVEKIT_API_KEY");
    const apiSecret = requireEnv("LIVEKIT_API_SECRET");
    const url = requireEnv("NEXT_PUBLIC_LIVEKIT_URL");

    const at = new AccessToken(apiKey, apiSecret, { identity });
    at.addGrant({ room: classId, roomJoin: true, canPublish: grants.canPublish, canSubscribe: grants.canSubscribe });
    const token = await at.toJwt();
    return { token, url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur de configuration audio." };
  }
}
