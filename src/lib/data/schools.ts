import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type School = Database["public"]["Tables"]["schools"]["Row"];
export type Federation = Database["public"]["Tables"]["federations"]["Row"];

export async function getSchool(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<School | null> {
  const { data, error } = await supabase.from("schools").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function getFederation(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<Federation | null> {
  const { data, error } = await supabase.from("federations").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

// Toutes les écoles du réseau, toutes fédérations confondues — réservé au
// super_admin (RLS schools_super_admin_read, 0010_super_admin.sql), pas de
// filtre par federation_id ici.
export async function getAllSchools(supabase: SupabaseClient<Database>): Promise<School[]> {
  const { data, error } = await supabase.from("schools").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getSchoolsForFederation(
  supabase: SupabaseClient<Database>,
  federationId: string,
): Promise<School[]> {
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("federation_id", federationId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}
