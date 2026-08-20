"use client";

import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n/types";

const ORDER: Locale[] = ["fr", "ar", "en"];
const LABEL: Record<Locale, string> = { fr: "FR", ar: "AR", en: "EN" };
const NAME: Record<Locale, string> = { fr: "Français", ar: "عربي", en: "English" };

// Bascule FR/AR/EN visible dans les trois coques (enseignant, élève,
// fédération) — même bouton partout, style adapté par le parent via
// className. Cycle vers la langue suivante à chaque clic ; le libellé
// affiché est celui de la langue courante.
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const next = ORDER[(ORDER.indexOf(locale) + 1) % ORDER.length];
  return (
    <button onClick={() => setLocale(next)} title={NAME[next]} className={className}>
      {LABEL[locale]}
    </button>
  );
}
