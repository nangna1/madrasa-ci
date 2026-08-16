import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type Student = Database["public"]["Tables"]["students"]["Row"];

export async function getStudents(
  supabase: SupabaseClient<Database>,
  schoolId: string,
): Promise<Student[]> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("school_id", schoolId)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getStudent(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<Student | null> {
  const { data, error } = await supabase.from("students").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export function initials(fullName: string): string {
  return fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
