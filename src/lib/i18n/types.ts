export type Locale = "fr" | "ar" | "en";
export const LOCALE_COOKIE = "scolaris_locale";
export const DEFAULT_LOCALE: Locale = "fr";

// Étiquette Intl (toLocaleDateString/toLocaleString) correspondant à chaque
// langue de l'app — évite de répéter la même chaîne de ternaires à chaque
// endroit qui formate une date.
export function intlTag(locale: Locale): string {
  if (locale === "ar") return "ar";
  if (locale === "en") return "en-US";
  return "fr-FR";
}
