"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/teacher" }).catch(() => {
      // L'app reste utilisable sans service worker, juste sans mise en cache offline.
    });
  }, []);

  return null;
}
