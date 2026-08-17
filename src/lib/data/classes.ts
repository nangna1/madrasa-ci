import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
export type ScheduleSlot = Database["public"]["Tables"]["class_schedule_slots"]["Row"];

export const JOURS_SEMAINE = [
  "", // 0 inutilisé (jour va de 1 à 7)
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

// Classe assignée à l'enseignant connecté — la policy RLS classes_teacher_own
// ne renvoie de toute façon que sa propre classe, donc pas besoin de filtrer
// explicitement par teacher_id ici.
export async function getMyClass(supabase: SupabaseClient<Database>): Promise<ClassRow | null> {
  const { data, error } = await supabase.from("classes").select("*").limit(1).maybeSingle();
  if (error) return null;
  return data;
}

export async function getScheduleSlots(
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<ScheduleSlot[]> {
  const { data, error } = await supabase
    .from("class_schedule_slots")
    .select("*")
    .eq("class_id", classId)
    .order("jour", { ascending: true })
    .order("heure_debut", { ascending: true });
  if (error) throw error;
  return data;
}

export function formatHeure(t: string): string {
  return t.slice(0, 5); // "15:00:00" -> "15:00"
}

// Jour ISO courant (1 = lundi ... 7 = dimanche), pour mettre en évidence le
// créneau du jour dans l'emploi du temps.
export function jourIsoAujourdhui(): number {
  const jsDay = new Date().getDay(); // 0 = dimanche ... 6 = samedi
  return jsDay === 0 ? 7 : jsDay;
}
