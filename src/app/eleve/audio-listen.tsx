"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";
import { createClient } from "@/lib/supabase/client";
import { subscribeLiveReading } from "@/lib/data/liveReading";
import { uploadClassRecording } from "@/lib/data/recordings";
import { getStudentAudioToken } from "@/app/actions/live-audio";
import { useLocale } from "@/components/locale-provider";

type Status = "idle" | "connecting" | "listening" | "error";

// Écoute l'audio en direct de l'enseignant (voir audio-broadcast-control.tsx
// côté enseignant). Rejoindre exige un tap explicite : les navigateurs
// bloquent la lecture audio automatique sans geste de l'utilisateur.
// Un élève à l'écoute peut aussi enregistrer ce qu'il entend (bouton
// dédié) — l'enregistrement est ensuite partagé avec toute la classe, pas
// gardé seulement pour lui (voir recordings-list.tsx).
export default function AudioListen({
  classId,
  initialActive,
  studentName,
}: {
  classId: string;
  initialActive: boolean;
  studentName: string;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [active, setActive] = useState(initialActive);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const remoteTrackRef = useRef<RemoteTrack | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const supabase = createClient();
    return subscribeLiveReading(supabase, classId, (reading) => setActive(reading?.audio_active ?? false));
  }, [classId]);

  useEffect(() => {
    // Le direct s'est arrêté côté enseignant pendant qu'on écoutait —
    // on se déconnecte proprement plutôt que d'attendre une erreur réseau.
    if (!active && roomRef.current) {
      mediaRecorderRef.current?.stop();
      roomRef.current.disconnect();
      roomRef.current = null;
      setStatus("idle");
      setRecording(false);
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
          remoteTrackRef.current = track;
          const el = track.attach();
          containerRef.current?.appendChild(el);
        }
      });
      await room.connect(result.url, result.token);
      roomRef.current = room;
      setStatus("listening");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Échec de la connexion audio."));
      setStatus("error");
    }
  }

  function leave() {
    mediaRecorderRef.current?.stop();
    roomRef.current?.disconnect();
    roomRef.current = null;
    setStatus("idle");
    setRecording(false);
  }

  function startRecording() {
    const mediaStreamTrack = remoteTrackRef.current?.mediaStreamTrack;
    if (!mediaStreamTrack) return;
    const stream = new MediaStream([mediaStreamTrack]);
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      void saveRecording(blob);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  }

  async function saveRecording(blob: Blob) {
    setUploadingRecording(true);
    try {
      const supabase = createClient();
      await uploadClassRecording(supabase, classId, blob, studentName);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Échec de l'enregistrement."));
    } finally {
      setUploadingRecording(false);
    }
  }

  if (!active) return null;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-green bg-[#F2F7F3] px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="text-sm font-semibold text-green">{t("🔊 Audio en direct disponible")}</div>
          <div className="text-xs text-ink-muted">
            {status === "listening" ? t("En écoute") : status === "error" ? (error ?? t("Erreur")) : t("L'enseignant parle en direct")}
          </div>
        </div>
        {status === "listening" ? (
          <button onClick={leave} className="rounded-lg border border-border-input bg-white px-3.5 py-2 text-xs font-semibold text-ink-soft">
            {t("Quitter")}
          </button>
        ) : (
          <button
            onClick={join}
            disabled={status === "connecting"}
            className="rounded-lg bg-green px-3.5 py-2 text-xs font-semibold text-card-alt disabled:opacity-60"
          >
            {status === "connecting" ? "…" : t("Rejoindre")}
          </button>
        )}
      </div>

      {status === "listening" && (
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={uploadingRecording}
          className={`rounded-lg border px-3.5 py-2 text-xs font-semibold ${
            recording ? "border-terracotta bg-terracotta text-card-alt" : "border-dashed border-border-input bg-white text-ink-soft"
          } disabled:opacity-60`}
        >
          {uploadingRecording ? t("Envoi de l'enregistrement…") : recording ? t("⏹ Arrêter l'enregistrement") : t("🔴 Enregistrer ce direct")}
        </button>
      )}

      <div ref={containerRef} className="hidden" />
    </div>
  );
}
