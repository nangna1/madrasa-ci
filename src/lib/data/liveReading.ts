import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type Ayah = Database["public"]["Tables"]["ayat"]["Row"];
export type LiveReading = Database["public"]["Tables"]["class_live_reading"]["Row"];

export async function getAyat(supabase: SupabaseClient<Database>, sourateId: number): Promise<Ayah[]> {
  const { data, error } = await supabase
    .from("ayat")
    .select("*")
    .eq("sourate_id", sourateId)
    .order("num", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getLiveReading(
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<LiveReading | null> {
  const { data, error } = await supabase
    .from("class_live_reading")
    .select("*")
    .eq("class_id", classId)
    .maybeSingle();
  if (error) return null;
  return data;
}

// Appelé par l'enseignant (Cours en direct) à chaque changement de sourate
// ou de verset — un upsert simple, diffusé en temps réel aux élèves via
// Supabase Realtime (voir subscribeLiveReading), pas d'aller-retour
// nécessaire côté élève.
export async function setLiveReading(
  supabase: SupabaseClient<Database>,
  classId: string,
  sourateId: number,
  ayahNum: number,
): Promise<void> {
  const { error } = await supabase
    .from("class_live_reading")
    .upsert(
      { class_id: classId, sourate_id: sourateId, ayah_num: ayahNum, updated_at: new Date().toISOString() },
      { onConflict: "class_id" },
    );
  if (error) throw error;
}

export async function clearLiveReading(supabase: SupabaseClient<Database>, classId: string): Promise<void> {
  const { error } = await supabase
    .from("class_live_reading")
    .upsert(
      { class_id: classId, sourate_id: null, ayah_num: null, updated_at: new Date().toISOString() },
      { onConflict: "class_id" },
    );
  if (error) throw error;
}

// S'abonne aux changements de lecture en direct d'une classe (élève comme
// enseignant). Retourne la fonction de désabonnement, à appeler au
// démontage du composant.
export function subscribeLiveReading(
  supabase: SupabaseClient<Database>,
  classId: string,
  onChange: (reading: LiveReading | null) => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`live-reading-${classId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "class_live_reading", filter: `class_id=eq.${classId}` },
      (payload) => {
        onChange((payload.new as LiveReading | undefined) ?? null);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
