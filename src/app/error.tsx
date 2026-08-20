"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

// Filet de secours pour toute erreur non gérée dans un segment de route.
// Volontairement sans dépendance à LocaleProvider/useLocale : cette page
// peut s'afficher précisément parce qu'un contexte plus haut dans l'arbre a
// planté, donc autant rester simple et toujours fonctionnel plutôt que de
// risquer une deuxième erreur ici. Texte en français uniquement (langue par
// défaut de l'app).
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-[0_24px_60px_rgba(38,30,16,0.12)]">
        <div className="font-serif text-2xl font-semibold text-ink">Scolaris</div>
        <p className="mt-4 text-sm text-ink-soft">
          Une erreur inattendue s&apos;est produite. L&apos;équipe technique en a été informée automatiquement.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-green px-4 py-3 text-sm font-semibold text-card-alt hover:bg-green-dark"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="rounded-lg border border-border-input px-4 py-3 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
