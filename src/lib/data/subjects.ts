import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SubjectCategory } from "@/lib/supabase/types";

export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type ClassSubject = Database["public"]["Tables"]["class_subjects"]["Row"];

export const CATEGORY_LABEL: Record<SubjectCategory, string> = {
  coranique: "Matières coraniques",
  national: "Programme national",
};

// Catalogue fixe des matières (voir supabase/migrations/0003_subjects.sql) —
// lecture seule côté app, à la manière du référentiel des sourates.
export async function getSubjectsCatalog(supabase: SupabaseClient<Database>): Promise<Subject[]> {
  const { data, error } = await supabase.from("subjects").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

// Matières activées pour une classe, jointes à leur fiche catalogue —
// c'est ce qui compose le "programme" réel de la classe.
export async function getClassSubjects(
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<(ClassSubject & { subject: Subject })[]> {
  const { data, error } = await supabase
    .from("class_subjects")
    .select("*, subject:subjects(*)")
    .eq("class_id", classId);
  if (error) throw error;
  return (data as (ClassSubject & { subject: Subject })[]).sort(
    (a, b) => a.subject.sort_order - b.subject.sort_order,
  );
}

export async function addClassSubject(
  supabase: SupabaseClient<Database>,
  classId: string,
  subjectCode: string,
): Promise<void> {
  const { error } = await supabase.from("class_subjects").insert({ class_id: classId, subject_code: subjectCode });
  if (error) throw error;
}

export async function removeClassSubject(supabase: SupabaseClient<Database>, classSubjectId: string): Promise<void> {
  const { error } = await supabase.from("class_subjects").delete().eq("id", classSubjectId);
  if (error) throw error;
}
