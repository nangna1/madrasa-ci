"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAyat, subscribeLiveReading, type Ayah, type LiveReading } from "@/lib/data/liveReading";
import type { Sourate } from "@/lib/data/memorization";

// Suit en temps réel la lecture de l'enseignant (voir live-reading-control.tsx
// côté enseignant) — même compte utilisable sur un écran/tablette partagé en
// salle ou sur le téléphone d'un élève, tous voient le même texte au même
// moment. Rien à cliquer côté élève : l'affichage suit tout seul.
export default function LiveReadingView({
  classId,
  sourates,
  initialReading,
}: {
  classId: string;
  sourates: Sourate[];
  initialReading: LiveReading | null;
}) {
  const [reading, setReading] = useState<LiveReading | null>(initialReading);
  const [ayat, setAyat] = useState<Ayah[]>([]);
  const currentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    return subscribeLiveReading(supabase, classId, setReading);
  }, [classId]);

  useEffect(() => {
    // Rien à charger sans lecture en cours — le rendu masque de toute façon
    // ce composant (`if (!reading?.sourate_id) return null;` plus bas), l'état
    // `ayat` potentiellement obsolète n'est jamais affiché dans ce cas.
    if (!reading?.sourate_id) return;
    let cancelled = false;
    const supabase = createClient();
    getAyat(supabase, reading.sourate_id).then((rows) => {
      if (!cancelled) setAyat(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [reading?.sourate_id]);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [reading?.ayah_num]);

  if (!reading?.sourate_id) return null;

  const sourate = sourates.find((s) => s.id === reading.sourate_id);

  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] border border-green bg-[#F2F7F3] p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-green">🔴 Lecture en direct</span>
        <span className="text-xs text-ink-muted">{sourate?.name}</span>
      </div>

      <div className="max-h-[420px] overflow-y-auto rounded-lg bg-white p-3">
        <div dir="rtl" className="font-arabic flex flex-col gap-3 text-lg leading-loose text-ink">
          {ayat.map((a) => {
            const isCurrent = a.num === reading.ayah_num;
            return (
              <span
                key={a.num}
                ref={isCurrent ? currentRef : undefined}
                className={isCurrent ? "rounded-md bg-green-tint px-1.5 py-1 text-green" : ""}
              >
                {a.text_ar}
                <span className="mx-1 text-sm text-ink-faint">﴿{a.num}﴾</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
