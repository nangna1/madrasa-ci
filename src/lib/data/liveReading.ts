import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type LiveReading = Database["public"]["Tables"]["class_live_reading"]["Row"];

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

// Publié par l'enseignant (Cours en direct) : ce qu'il tape ou colle est
// diffusé en temps réel à tous les élèves de la classe via Supabase
// Realtime (voir subscribeLiveReading) — aucune base de contenu à charger,
// l'enseignant est la seule source.
export async function setLiveReading(
  supabase: SupabaseClient<Database>,
  classId: string,
  title: string,
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from("class_live_reading")
    .upsert({ class_id: classId, title, content, updated_at: new Date().toISOString() }, { onConflict: "class_id" });
  if (error) throw error;
}

export async function clearLiveReading(supabase: SupabaseClient<Database>, classId: string): Promise<void> {
  const { error } = await supabase
    .from("class_live_reading")
    .upsert(
      { class_id: classId, title: null, content: null, updated_at: new Date().toISOString() },
      { onConflict: "class_id" },
    );
  if (error) throw error;
}

// Bascule le drapeau "audio en cours" (voir 0008_live_audio.sql) — c'est
// tout ce que cette table sait du flux audio lui-même, qui vit dans
// LiveKit Cloud (voir src/app/actions/live-audio.ts) ; ce booléen ne sert
// qu'à afficher "🔊 Rejoindre" côté élève sans interroger LiveKit.
export async function setAudioActive(
  supabase: SupabaseClient<Database>,
  classId: string,
  active: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("class_live_reading")
    .upsert(
      { class_id: classId, audio_active: active, updated_at: new Date().toISOString() },
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
