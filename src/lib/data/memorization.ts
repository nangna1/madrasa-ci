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

// Version "en masse" de getProgressForStudent, pour afficher toute une
// classe sans une requête par élève (utilisé par l'écran "Cours en direct").
export async function getProgressRows(
  supabase: SupabaseClient<Database>,
  studentIds: string[],
): Promise<Map<string, Map<number, MemoStatus>>> {
  if (studentIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("memorization_progress")
    .select("student_id, sourate_id, status")
    .in("student_id", studentIds);
  if (error) throw error;

  const byStudent = new Map<string, Map<number, MemoStatus>>();
  for (const row of data) {
    if (!byStudent.has(row.student_id)) byStudent.set(row.student_id, new Map());
    byStudent.get(row.student_id)!.set(row.sourate_id, row.status);
  }
  return byStudent;
}

// Prochaine sourate sur laquelle travailler avec un élève : la première non
// encore mémorisée, dans l'ordre d'apprentissage (`sourates` déjà trié
// juz' 30 → 1 par getSourates). Null si tout est mémorisé.
export function nextSourateFor(sourates: Sourate[], progress: Map<number, MemoStatus> | undefined): Sourate | null {
  for (const s of sourates) {
    if ((progress?.get(s.id) ?? "todo") !== "ok") return s;
  }
  return null;
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
