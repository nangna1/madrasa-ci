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
      {
        class_id: classId,
        title: null,
        content: null,
        attachment_path: null,
        attachment_name: null,
        attachment_type: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "class_id" },
    );
  if (error) throw error;
}

const ATTACHMENT_BUCKET = "live-content";

// Dépose le fichier dans le bucket Storage (chemin préfixé par l'ID de
// classe — c'est ce préfixe que les policies RLS de storage.objects
// vérifient pour n'autoriser que l'enseignant titulaire à écrire ici) puis
// publie sa référence, diffusée comme le reste de la lecture en direct.
export async function uploadLiveAttachment(
  supabase: SupabaseClient<Database>,
  classId: string,
  file: File,
): Promise<{ path: string; name: string; type: string }> {
  const path = `${classId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(ATTACHMENT_BUCKET).upload(path, file);
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("class_live_reading").upsert(
    {
      class_id: classId,
      attachment_path: path,
      attachment_name: file.name,
      attachment_type: file.type,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "class_id" },
  );
  if (error) throw error;

  return { path, name: file.name, type: file.type };
}

export async function removeLiveAttachment(
  supabase: SupabaseClient<Database>,
  classId: string,
  previousPath: string | null,
): Promise<void> {
  const { error } = await supabase.from("class_live_reading").upsert(
    { class_id: classId, attachment_path: null, attachment_name: null, attachment_type: null, updated_at: new Date().toISOString() },
    { onConflict: "class_id" },
  );
  if (error) throw error;
  if (previousPath) {
    // Best-effort : le fichier orphelin dans Storage n'empêche rien de
    // fonctionner, on ne bloque pas l'action de l'enseignant sur ça.
    await supabase.storage.from(ATTACHMENT_BUCKET).remove([previousPath]).catch(() => {});
  }
}

export function getLiveAttachmentUrl(supabase: SupabaseClient<Database>, path: string): string {
  return supabase.storage.from(ATTACHMENT_BUCKET).getPublicUrl(path).data.publicUrl;
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
// démontage du composant. Suffixe aléatoire dans le nom du canal : deux
// composants (LiveReadingView + AudioListen côté élève) s'abonnent
// indépendamment à la même classe — un nom de canal partagé fait échouer
// le second abonnement ("cannot add postgres_changes callbacks... after
// subscribe()"), Supabase Realtime exigeant un topic unique par canal.
export function subscribeLiveReading(
  supabase: SupabaseClient<Database>,
  classId: string,
  onChange: (reading: LiveReading | null) => void,
): () => void {
  const uniqueSuffix = Math.random().toString(36).slice(2);
  const channel: RealtimeChannel = supabase
    .channel(`live-reading-${classId}-${uniqueSuffix}`)
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
