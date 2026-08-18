"use client";

import { useLocale } from "@/components/locale-provider";

// Bascule FR/AR visible dans les trois coques (enseignant, élève,
// fédération) — même bouton partout, style adapté par le parent via
// className.
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === "fr" ? "ar" : "fr")}
      title={locale === "fr" ? "عربي" : "Français"}
      className={className}
    >
      {locale === "fr" ? "AR" : "FR"}
    </button>
  );
}
