"use client";

import { createClient } from "@/lib/supabase/client";
import { getRecordingUrl, type Recording } from "@/lib/data/recordings";
import { useLocale } from "@/components/locale-provider";

// Liste des enregistrements du direct pour une classe — alimentée par les
// élèves (voir audio-listen.tsx), consultable aussi bien côté élève que
// côté enseignant (Cours en direct). Chargée côté serveur (page.tsx), pas
// de mise à jour temps réel ici : pas aussi urgent que le direct lui-même,
// un rechargement de page suffit à voir un nouvel enregistrement.
export default function RecordingsList({ recordings }: { recordings: Recording[] }) {
  const { t, locale } = useLocale();
  if (recordings.length === 0) return null;
  const supabase = createClient();

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border-soft bg-card p-3.5">
      <div className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
        {t("🎧 Enregistrements ({n})", { n: recordings.length })}
      </div>
      <div className="flex flex-col gap-2">
        {recordings.map((r) => (
          <div key={r.id} className="flex flex-col gap-1.5 rounded-lg bg-paper-sunk p-2.5">
            <div className="flex items-baseline justify-between text-[11px] text-ink-faint">
              <span>{r.recorded_by_name ?? t("Élève")}</span>
              <span>
                {new Date(r.created_at).toLocaleString(locale === "ar" ? "ar" : "fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <audio controls src={getRecordingUrl(supabase, r.storage_path)} className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
