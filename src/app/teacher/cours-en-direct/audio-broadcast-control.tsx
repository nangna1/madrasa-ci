"use client";

import { useRef, useState } from "react";
import { Room } from "livekit-client";
import { createClient } from "@/lib/supabase/client";
import { setAudioActive } from "@/lib/data/liveReading";
import { getTeacherAudioToken } from "@/app/actions/live-audio";
import { useLocale } from "@/components/locale-provider";

type Status = "idle" | "connecting" | "live" | "error";

// Émission audio en direct (LiveKit) : l'enseignant publie son micro dans
// une room nommée d'après l'ID de la classe, écouté par tous les comptes
// élève connectés (voir audio-listen.tsx). Pas de vidéo — plus léger en
// données mobiles, suffisant pour suivre une lecture/explication orale.
export default function AudioBroadcastControl({ classId }: { classId: string }) {
  const { t } = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

  async function start() {
    setStatus("connecting");
    setError(null);
    try {
      const result = await getTeacherAudioToken(classId);
      if ("error" in result) throw new Error(result.error);

      const room = new Room();
      await room.connect(result.url, result.token);
      await room.localParticipant.setMicrophoneEnabled(true);
      roomRef.current = room;

      const supabase = createClient();
      await setAudioActive(supabase, classId, true);
      setStatus("live");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Échec de la connexion audio."));
      setStatus("error");
      roomRef.current?.disconnect();
      roomRef.current = null;
    }
  }

  async function stop() {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setStatus("idle");
    try {
      const supabase = createClient();
      await setAudioActive(supabase, classId, false);
    } catch {
      // L'enseignant a déjà quitté localement ; l'indicateur "en direct"
      // côté élève sera de toute façon désactivé à la prochaine action.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-card px-3.5 py-3">
      <div className="flex flex-col gap-0.5">
        <div className="text-sm font-semibold text-ink">
          {status === "live" ? t("🎙️ Micro en direct") : t("Audio en direct")}
        </div>
        <div className="text-xs text-ink-muted">
          {status === "connecting" && t("Connexion…")}
          {status === "live" && t("Les élèves connectés vous entendent")}
          {status === "idle" && t("Diffusez votre voix aux élèves connectés")}
          {status === "error" && (error ?? t("Erreur"))}
        </div>
      </div>
      {status === "live" ? (
        <button onClick={stop} className="rounded-lg border border-terracotta px-3.5 py-2 text-xs font-semibold text-terracotta">
          {t("Arrêter")}
        </button>
      ) : (
        <button
          onClick={start}
          disabled={status === "connecting"}
          className="rounded-lg bg-green px-3.5 py-2 text-xs font-semibold text-card-alt disabled:opacity-60"
        >
          {status === "connecting" ? "…" : t("Démarrer l'audio")}
        </button>
      )}
    </div>
  );
}
