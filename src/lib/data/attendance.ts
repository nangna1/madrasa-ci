import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getAttendanceForDate(
  supabase: SupabaseClient<Database>,
  studentIds: string[],
  date: string,
): Promise<Map<string, boolean | null>> {
  if (studentIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("attendance")
    .select("student_id, present")
    .in("student_id", studentIds)
    .eq("date", date);
  if (error) throw error;
  return new Map(data.map((r) => [r.student_id, r.present]));
}

// Résumé du mois courant pour un seul élève — utilisé par l'espace élève
// (aucun besoin de la présence jour par jour, juste "X présences / Y jours
// enregistrés" pour donner une idée de l'assiduité).
export async function getMonthAttendanceSummary(
  supabase: SupabaseClient<Database>,
  studentId: string,
): Promise<{ present: number; recorded: number }> {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { data, error } = await supabase
    .from("attendance")
    .select("present")
    .eq("student_id", studentId)
    .gte("date", monthStart);
  if (error) throw error;
  return { present: data.filter((r) => r.present === true).length, recorded: data.length };
}

export async function markAttendance(
  supabase: SupabaseClient<Database>,
  studentId: string,
  date: string,
  present: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("attendance")
    .upsert({ student_id: studentId, date, present }, { onConflict: "student_id,date" });
  if (error) throw error;
}
