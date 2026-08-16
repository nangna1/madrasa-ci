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
