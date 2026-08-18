"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  setLiveReading,
  clearLiveReading,
  uploadLiveAttachment,
  removeLiveAttachment,
  getLiveAttachmentUrl,
  type LiveReading,
} from "@/lib/data/liveReading";

type Attachment = { path: string; name: string; type: string };

// Contrôle de la lecture en direct : l'enseignant tape ou colle ce qu'il
// exploite en classe (verset, extrait de fiqh, leçon d'arabe...), peut y
// joindre une image, un fichier, ou un message audio enregistré au micro,
// et publie — diffusé en temps réel à tous les comptes élève de la classe
// (voir live-reading-view.tsx côté élève), écran partagé en salle ou
// téléphone individuel, tout le monde voit/entend le même contenu.
export default function LiveReadingControl({
  classId,
  initialReading,
}: {
  classId: string;
  initialReading: LiveReading | null;
}) {
  const [live, setLive] = useState(Boolean(initialReading?.content || initialReading?.attachment_path));
  const [title, setTitle] = useState(initialReading?.title ?? "");
  const [content, setContent] = useState(initialReading?.content ?? "");
  const [attachment, setAttachment] = useState<Attachment | null>(
    initialReading?.attachment_path
      ? { path: initialReading.attachment_path, name: initialReading.attachment_name ?? "", type: initialReading.attachment_type ?? "" }
      : null,
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function uploadFile(file: File) {
    setUploading(true);
    setAttachmentError(null);
    const previousPath = attachment?.path ?? null;
    try {
      const supabase = createClient();
      const uploaded = await uploadLiveAttachment(supabase, classId, file);
      if (previousPath) void supabase.storage.from("live-content").remove([previousPath]);
      setAttachment(uploaded);
      setLive(true);
    } catch (err) {
      setAttachmentError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setUploading(false);
    }
  }

  async function handlePublish() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await setLiveReading(supabase, classId, title.trim(), content.trim());
      setLive(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadFile(file);
  }

  async function startRecording() {
    setAttachmentError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const mimeType = recorder.mimeType || "audio/webm";
        const ext = mimeType.includes("mp4") ? "m4a" : "webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        void uploadFile(new File([blob], `message-vocal-${Date.now()}.${ext}`, { type: mimeType }));
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setAttachmentError("Micro indisponible ou accès refusé.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  }

  async function handleRemoveAttachment() {
    const supabase = createClient();
    await removeLiveAttachment(supabase, classId, attachment?.path ?? null);
    setAttachment(null);
  }

  async function handleStop() {
    setSaving(true);
    try {
      const supabase = createClient();
      await removeLiveAttachment(supabase, classId, attachment?.path ?? null);
      await clearLiveReading(supabase, classId);
      setLive(false);
      setAttachment(null);
    } finally {
      setSaving(false);
    }
  }

  const isImage = attachment?.type.startsWith("image/");
  const isAudio = attachment?.type.startsWith("audio/");
  const attachmentUrl = attachment ? getLiveAttachmentUrl(createClient(), attachment.path) : null;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-green bg-[#F2F7F3] p-3.5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-green">
          {live ? "🔴 En direct" : "Lecture en direct"}
        </div>
        {live && (
          <button onClick={handleStop} disabled={saving} className="text-xs text-terracotta">
            Arrêter le direct
          </button>
        )}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre (ex. Sourate Al-Baqara, verset 255)"
        className="rounded-lg border border-border-input bg-white px-2.5 py-2 text-sm text-ink"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        dir="auto"
        placeholder="Le texte ou l'extrait que la classe suit en ce moment…"
        className="font-arabic resize-y rounded-lg border border-border-input bg-white px-2.5 py-2 text-base leading-relaxed text-ink"
      />

      {attachment ? (
        <div className="flex items-center gap-2.5 rounded-lg bg-white p-2">
          {isImage && attachmentUrl ? (
            <img src={attachmentUrl} alt="" className="h-14 w-14 rounded-md object-cover" />
          ) : isAudio && attachmentUrl ? (
            <audio controls src={attachmentUrl} className="h-9 flex-1" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-cream text-xl">📎</div>
          )}
          {!isAudio && <div className="flex-1 truncate text-xs text-ink-soft">{attachment.name}</div>}
          <button onClick={handleRemoveAttachment} className="text-xs text-terracotta">
            Retirer
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-border-input bg-white px-2.5 py-2.5 text-center text-xs font-semibold text-ink-muted">
            {uploading ? "Envoi…" : "📎 Joindre une image/fichier"}
            <input type="file" onChange={(e) => void handleFile(e)} disabled={uploading || recording} className="hidden" />
          </label>
          <button
            onClick={recording ? stopRecording : () => void startRecording()}
            disabled={uploading}
            className={`flex-1 rounded-lg border px-2.5 py-2.5 text-xs font-semibold ${
              recording ? "border-terracotta bg-terracotta text-card-alt" : "border-dashed border-border-input bg-white text-ink-muted"
            }`}
          >
            {recording ? "⏹ Arrêter l'enregistrement" : "🎙️ Message vocal"}
          </button>
        </div>
      )}
      {attachmentError && <div className="text-xs text-terracotta">{attachmentError}</div>}

      <button
        onClick={handlePublish}
        disabled={saving || !content.trim()}
        className="rounded-lg bg-green py-2.5 text-sm font-semibold text-card-alt disabled:opacity-40"
      >
        {saving ? "Publication…" : live ? "Mettre à jour" : "Publier en direct"}
      </button>
    </div>
  );
}
