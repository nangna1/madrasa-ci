import * as Sentry from "@sentry/nextjs";

// Convention Next.js pour l'instrumentation serveur/edge (voir
// node_modules/next/dist/docs/01-app/02-guides/instrumentation.md) : ce
// fichier remplace l'ancien sentry.server.config.ts/sentry.edge.config.ts
// des versions plus anciennes du SDK. Ajouté le 2026-08-20 : avant ça,
// aucune erreur serveur n'était visible nulle part sauf report manuel d'un
// utilisateur (paiements, comptes élève, RLS — trop sensible pour rester
// aveugle en prod).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      // 10% des requêtes tracées : suffisant pour repérer des tendances de
      // performance sans saturer le quota gratuit sur un pilote à faible trafic.
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
