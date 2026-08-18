import { ar } from "./ar";
import type { Locale } from "./types";

// Traduction façon gettext : `text` est à la fois la clé et le contenu
// français par défaut — un texte absent du dictionnaire arabe s'affiche en
// français plutôt que de casser l'écran. `{nom}` dans le texte est
// remplacé par la valeur correspondante dans `vars` (utile pour les
// nombres : "{n} inscrits" -> "{n} مسجَّل").
export function translate(locale: Locale, text: string, vars?: Record<string, string | number>): string {
  let s = locale === "ar" ? (ar[text] ?? text) : text;
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      s = s.replaceAll(`{${key}}`, String(value));
    }
  }
  return s;
}
