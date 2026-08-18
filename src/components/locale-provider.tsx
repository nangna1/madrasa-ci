"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { translate } from "@/lib/i18n/dictionary";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/types";

interface LocaleContext {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (text: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<LocaleContext | null>(null);

// Fournit la langue courante aux composants client, et permet de la
// changer à tout moment (bouton dans chaque coque). Le cookie est la
// source de vérité : les composants serveur le lisent directement (voir
// src/lib/i18n/server.ts), router.refresh() les fait donc redessiner avec
// la nouvelle langue sans recharger la page.
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
      setLocaleState(next);
      router.refresh();
    },
    [router],
  );

  const t = useCallback((text: string, vars?: Record<string, string | number>) => translate(locale, text, vars), [locale]);

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
