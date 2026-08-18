"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    try {
      // Certains contextes (navigation privée Firefox notamment) font
      // échouer .register() par une exception synchrone plutôt qu'une
      // promesse rejetée — le .catch() seul ne suffit pas à l'attraper.
      navigator.serviceWorker.register("/sw.js", { scope: "/teacher" }).catch(() => {
        // L'app reste utilisable sans service worker, juste sans mise en cache offline.
      });
    } catch {
      // Idem : service worker indisponible dans ce contexte, on continue sans.
    }
  }, []);

  return null;
}
