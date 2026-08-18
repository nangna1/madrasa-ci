"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeLiveReading, type LiveReading } from "@/lib/data/liveReading";

// Suit en temps réel ce que l'enseignant publie (voir live-reading-control.tsx
// côté enseignant) — même compte utilisable sur un écran/tablette partagé en
// salle ou sur le téléphone d'un élève, tous voient le même texte au même
// moment. Rien à cliquer côté élève : l'affichage suit tout seul.
export default function LiveReadingView({
  classId,
  initialReading,
}: {
  classId: string;
  initialReading: LiveReading | null;
}) {
  const [reading, setReading] = useState<LiveReading | null>(initialReading);

  useEffect(() => {
    const supabase = createClient();
    return subscribeLiveReading(supabase, classId, setReading);
  }, [classId]);

  if (!reading?.content) return null;

  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] border border-green bg-[#F2F7F3] p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-green">🔴 Lecture en direct</span>
        {reading.title && <span className="text-xs text-ink-muted">{reading.title}</span>}
      </div>
      <div dir="auto" className="font-arabic whitespace-pre-wrap rounded-lg bg-white p-3 text-lg leading-loose text-ink">
        {reading.content}
      </div>
    </div>
  );
}
