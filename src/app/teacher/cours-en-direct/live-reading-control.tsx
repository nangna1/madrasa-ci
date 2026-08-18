"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { setLiveReading, clearLiveReading, type LiveReading } from "@/lib/data/liveReading";

// Contrôle de la lecture en direct : l'enseignant tape ou colle ce qu'il
// exploite en classe (verset, extrait de fiqh, leçon d'arabe...) et publie
// — diffusé en temps réel à tous les comptes élève de la classe (voir
// live-reading-view.tsx côté élève), écran partagé en salle ou téléphone
// individuel, tout le monde voit le même texte au même moment.
export default function LiveReadingControl({
  classId,
  initialReading,
}: {
  classId: string;
  initialReading: LiveReading | null;
}) {
  const [live, setLive] = useState(Boolean(initialReading?.content));
  const [title, setTitle] = useState(initialReading?.title ?? "");
  const [content, setContent] = useState(initialReading?.content ?? "");
  const [saving, setSaving] = useState(false);

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

  async function handleStop() {
    setSaving(true);
    try {
      const supabase = createClient();
      await clearLiveReading(supabase, classId);
      setLive(false);
    } finally {
      setSaving(false);
    }
  }

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
