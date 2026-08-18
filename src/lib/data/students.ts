import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type Student = Database["public"]["Tables"]["students"]["Row"];

export async function getStudents(
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<Student[]> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("class_id", classId)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createStudent(
  supabase: SupabaseClient<Database>,
  input: {
    schoolId: string;
    classId: string;
    fullName: string;
    nameAr?: string;
    age?: number;
    parentName?: string;
    parentPhone?: string;
  },
): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .insert({
      school_id: input.schoolId,
      class_id: input.classId,
      full_name: input.fullName,
      name_ar: input.nameAr || null,
      age: input.age ?? null,
      parent_name: input.parentName || null,
      parent_phone: input.parentPhone || null,
    })
    .select()
    .single();
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
