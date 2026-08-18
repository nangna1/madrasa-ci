import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type Recording = Database["public"]["Tables"]["class_recordings"]["Row"];

const BUCKET = "live-content";

export async function getClassRecordings(
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<Recording[]> {
  const { data, error } = await supabase
    .from("class_recordings")
    .select("*")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Uploadé par un élève à l'écoute du direct (voir audio-listen.tsx) —
// même bucket que les pièces jointes de la lecture en direct, sous
// <class_id>/recordings/ (la policy Storage live_content_student_write,
// 0011, n'autorise l'élève à écrire que sous le dossier de sa propre
// classe). Visible ensuite par toute la classe, pas seulement celui qui a
// enregistré.
export async function uploadClassRecording(
  supabase: SupabaseClient<Database>,
  classId: string,
  blob: Blob,
  recordedByName: string,
): Promise<void> {
  const path = `${classId}/recordings/${Date.now()}.webm`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || "audio/webm",
  });
  if (uploadError) throw uploadError;

  const { error } = await supabase
    .from("class_recordings")
    .insert({ class_id: classId, storage_path: path, recorded_by_name: recordedByName });
  if (error) throw error;
}

export function getRecordingUrl(supabase: SupabaseClient<Database>, path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
