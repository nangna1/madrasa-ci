import { cookies } from "next/headers";
import { translate } from "./dictionary";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "./types";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "ar" ? "ar" : DEFAULT_LOCALE;
}

// Utilisé dans les composants serveur (page.tsx, layout.tsx) :
// const { t, locale } = await getT();
export async function getT() {
  const locale = await getLocale();
  return { locale, t: (text: string, vars?: Record<string, string | number>) => translate(locale, text, vars) };
}
