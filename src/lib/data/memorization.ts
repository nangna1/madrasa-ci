import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MemoStatus } from "@/lib/supabase/types";

export type Sourate = Database["public"]["Tables"]["sourates"]["Row"];
export const TOTAL_SOURATES = 114;

// Ordre d'apprentissage traditionnel : juz' 30 en premier (sourate 114 → 1).
export async function getSourates(supabase: SupabaseClient<Database>): Promise<Sourate[]> {
  const { data, error } = await supabase
    .from("sourates")
    .select("*")
    .order("num", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProgressForStudent(
  supabase: SupabaseClient<Database>,
  studentId: string,
): Promise<Map<number, MemoStatus>> {
  const { data, error } = await supabase
    .from("memorization_progress")
    .select("sourate_id, status")
    .eq("student_id", studentId);
  if (error) throw error;
  return new Map(data.map((r) => [r.sourate_id, r.status]));
}

export async function getProgressCounts(
  supabase: SupabaseClient<Database>,
  studentIds: string[],
): Promise<Map<string, number>> {
  if (studentIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("memorization_progress")
    .select("student_id, status")
    .in("student_id", studentIds)
    .eq("status", "ok");
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.student_id, (counts.get(row.student_id) ?? 0) + 1);
  }
  return counts;
}

const CYCLE: MemoStatus[] = ["todo", "wip", "ok"];

export function nextMemoStatus(current: MemoStatus): MemoStatus {
  return CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
}

export async function setProgress(
  supabase: SupabaseClient<Database>,
  studentId: string,
  sourateId: number,
  status: MemoStatus,
): Promise<void> {
  const { error } = await supabase.from("memorization_progress").upsert(
    {
      student_id: studentId,
      sourate_id: sourateId,
      status,
      validated_at: status === "ok" ? new Date().toISOString() : null,
    },
    { onConflict: "student_id,sourate_id" },
  );
  if (error) throw error;
}

export async function cycleProgress(
  supabase: SupabaseClient<Database>,
  studentId: string,
  sourateId: number,
  currentStatus: MemoStatus,
): Promise<MemoStatus> {
  const next = nextMemoStatus(currentStatus);
  await setProgress(supabase, studentId, sourateId, next);
  return next;
}
