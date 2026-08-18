"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAyat, setLiveReading, clearLiveReading, type Ayah, type LiveReading } from "@/lib/data/liveReading";
import type { Sourate } from "@/lib/data/memorization";

// Contrôle de la lecture en direct : l'enseignant choisit la sourate et
// avance verset par verset, diffusé en temps réel à tous les comptes
// élève de la classe (voir live-reading-view.tsx côté élève) — écran
// partagé en salle ou téléphone individuel, tout le monde suit le même
// texte affiché en même temps que le maître le lit.
export default function LiveReadingControl({
  classId,
  sourates,
  initialReading,
}: {
  classId: string;
  sourates: Sourate[];
  initialReading: LiveReading | null;
}) {
  const [sourateId, setSourateId] = useState<number | null>(initialReading?.sourate_id ?? null);
  const [ayahNum, setAyahNum] = useState<number>(initialReading?.ayah_num ?? 1);
  const [ayat, setAyat] = useState<Ayah[]>([]);
  const [saving, setSaving] = useState(false);
  // "Chargement…" dérivé plutôt que suivi dans un état séparé (voir
  // règle react-hooks/set-state-in-effect) : vrai tant que la liste de
  // versets n'appartient pas encore à la sourate actuellement choisie.
  const loadingAyat = sourateId !== null && ayat[0]?.sourate_id !== sourateId;

  useEffect(() => {
    // Rien à charger sans sourate choisie — l'état `ayat` (potentiellement
    // encore rempli d'une sourate précédente) reste inutilisé tant que
    // sourateId est nul : la section qui l'affiche est alors masquée.
    if (!sourateId) return;
    let cancelled = false;
    const supabase = createClient();
    getAyat(supabase, sourateId).then((rows) => {
      if (!cancelled) setAyat(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [sourateId]);

  async function publish(nextSourateId: number, nextAyahNum: number) {
    setSaving(true);
    try {
      const supabase = createClient();
      await setLiveReading(supabase, classId, nextSourateId, nextAyahNum);
    } finally {
      setSaving(false);
    }
  }

  function handleSourateChange(id: number) {
    setSourateId(id);
    setAyahNum(1);
    void publish(id, 1);
  }

  function handleStep(delta: number) {
    if (!sourateId || ayat.length === 0) return;
    const next = Math.min(Math.max(ayahNum + delta, 1), ayat.length);
    setAyahNum(next);
    void publish(sourateId, next);
  }

  async function handleStop() {
    setSourateId(null);
    setAyahNum(1);
    setSaving(true);
    try {
      const supabase = createClient();
      await clearLiveReading(supabase, classId);
    } finally {
      setSaving(false);
    }
  }

  const currentAyah = ayat.find((a) => a.num === ayahNum);
  const sourate = sourates.find((s) => s.id === sourateId);

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-green bg-[#F2F7F3] p-3.5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-green">🔴 Lecture en direct</div>
        {sourateId && (
          <button onClick={handleStop} disabled={saving} className="text-xs text-terracotta">
            Arrêter le direct
          </button>
        )}
      </div>

      <select
        value={sourateId ?? ""}
        onChange={(e) => e.target.value && handleSourateChange(Number(e.target.value))}
        className="rounded-lg border border-border-input bg-white px-2.5 py-2 text-sm text-ink"
      >
        <option value="">— Choisir une sourate —</option>
        {sourates.map((s) => (
          <option key={s.id} value={s.id}>
            {s.num}. {s.name}
          </option>
        ))}
      </select>

      {sourateId && (
        <>
          <div className="rounded-lg bg-white px-3 py-3 text-center">
            {loadingAyat ? (
              <span className="text-sm text-ink-faint">Chargement…</span>
            ) : currentAyah ? (
              <>
                <div dir="rtl" className="font-arabic text-xl leading-relaxed text-ink">
                  {currentAyah.text_ar}
                </div>
                <div className="mt-1.5 text-xs text-ink-muted">
                  {sourate?.name} · verset {ayahNum}/{ayat.length}
                </div>
              </>
            ) : (
              <span className="text-sm text-ink-faint">Verset introuvable.</span>
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => handleStep(-1)}
              disabled={saving || ayahNum <= 1}
              className="flex-1 rounded-lg border border-border-input bg-white py-2.5 text-sm font-semibold text-ink-soft disabled:opacity-40"
            >
              ‹ Précédent
            </button>
            <button
              onClick={() => handleStep(1)}
              disabled={saving || ayahNum >= ayat.length}
              className="flex-1 rounded-lg bg-green py-2.5 text-sm font-semibold text-card-alt disabled:opacity-40"
            >
              Suivant ›
            </button>
          </div>
        </>
      )}
    </div>
  );
}
