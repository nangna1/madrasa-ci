"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Filet de secours ultime : ne se déclenche que si le layout racine
// lui-même plante (voir error.tsx pour le cas plus courant d'une erreur
// dans un segment de route). Next.js exige que ce fichier redéfinisse ses
// propres balises <html>/<body> puisqu'il remplace tout le layout racine —
// donc pas de dépendance à globals.css/Tailwind ni aux polices Google Fonts
// (elles pourraient être la cause du plantage) : styles inline minimalistes
// pour rester fonctionnel dans le pire des cas.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "Helvetica, Arial, sans-serif", background: "#FBF7EE", color: "#1A1A17" }}>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              borderRadius: 16,
              border: "1px solid #E1D8C5",
              background: "#FFFFFF",
              padding: 32,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 600 }}>Scolaris</div>
            <p style={{ marginTop: 16, fontSize: 14, color: "#4A4638" }}>
              Une erreur inattendue a empêché le chargement de l&apos;application. L&apos;équipe technique en a été
              informée automatiquement.
            </p>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  borderRadius: 8,
                  background: "#1F6B4A",
                  color: "#F7F2E7",
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Réessayer
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- <a> volontaire :
                  ce fichier remplace tout le layout racine (donc potentiellement le routeur
                  Next.js lui-meme), <Link/> n'est pas fiable a garantir ici. */}
              <a
                href="/"
                style={{
                  borderRadius: 8,
                  border: "1px solid #DCD3C0",
                  color: "#6E6857",
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Retour à l&apos;accueil
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
