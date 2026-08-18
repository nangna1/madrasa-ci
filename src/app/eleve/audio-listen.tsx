"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { createClient } from "@/lib/supabase/client";
import { subscribeLiveReading } from "@/lib/data/liveReading";
import { getStudentAudioToken } from "@/app/actions/live-audio";

type Status = "idle" | "connecting" | "listening" | "error";

// Écoute l'audio en direct de l'enseignant (voir audio-broadcast-control.tsx
// côté enseignant). Rejoindre exige un tap explicite : les navigateurs
// bloquent la lecture audio automatique sans geste de l'utilisateur.
export default function AudioListen({
  classId,
  initialActive,
}: {
  classId: string;
  initialActive: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    return subscribeLiveReading(supabase, classId, (reading) => setActive(reading?.audio_active ?? false));
  }, [classId]);

  useEffect(() => {
    // Le direct s'est arrêté côté enseignant pendant qu'on écoutait —
    // on se déconnecte proprement plutôt que d'attendre une erreur réseau.
    if (!active && roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
      setStatus("idle");
    }
  }, [active]);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
    };
  }, []);

  async function join() {
    setStatus("connecting");
    setError(null);
    try {
      const result = await getStudentAudioToken(classId);
      if ("error" in result) throw new Error(result.error);

      const room = new Room();
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          containerRef.current?.appendChild(el);
        }
      });
      await room.connect(result.url, result.token);
      roomRef.current = room;
      setStatus("listening");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la connexion audio.");
      setStatus("error");
    }
  }

  function leave() {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setStatus("idle");
  }

  if (!active) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-green bg-[#F2F7F3] px-3.5 py-3">
      <div className="flex flex-col gap-0.5">
        <div className="text-sm font-semibold text-green">🔊 Audio en direct disponible</div>
        <div className="text-xs text-ink-muted">
          {status === "listening" ? "En écoute" : status === "error" ? error ?? "Erreur" : "L'enseignant parle en direct"}
        </div>
      </div>
      {status === "listening" ? (
        <button onClick={leave} className="rounded-lg border border-border-input bg-white px-3.5 py-2 text-xs font-semibold text-ink-soft">
          Quitter
        </button>
      ) : (
        <button
          onClick={join}
          disabled={status === "connecting"}
          className="rounded-lg bg-green px-3.5 py-2 text-xs font-semibold text-card-alt disabled:opacity-60"
        >
          {status === "connecting" ? "…" : "Rejoindre"}
        </button>
      )}
      <div ref={containerRef} className="hidden" />
    </div>
  );
}
