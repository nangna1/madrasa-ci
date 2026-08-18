"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { enqueue, getQueue, onQueueChange } from "./queue";
import { flushQueue } from "./sync";
import type { NewQueuedAction } from "./types";

interface OfflineState {
  online: boolean;
  pendingCount: number;
  syncing: boolean;
  flush: () => Promise<void>;
  /** Tente l'appel direct ; si hors-ligne ou en échec réseau, met l'action en file. */
  runOrQueue: <T>(action: NewQueuedAction, directCall: () => Promise<T>) => Promise<{ synced: boolean }>;
}

const Ctx = createContext<OfflineState | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Toujours `true` au premier rendu (serveur et client) : lire
  // `navigator.onLine` dès l'initialisation ferait diverger le HTML rendu
  // côté client de celui du serveur dès que le navigateur se croit
  // hors-ligne au chargement, ce qui casse l'hydratation React. La vraie
  // valeur est appliquée juste après le montage, dans l'effet ci-dessous.
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const flushing = useRef(false);

  const refreshCount = useCallback(async () => {
    setPendingCount((await getQueue()).length);
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current || !navigator.onLine) return;
    flushing.current = true;
    setSyncing(true);
    try {
      const supabase = createClient();
      await flushQueue(supabase);
      await refreshCount();
      router.refresh();
    } finally {
      setSyncing(false);
      flushing.current = false;
    }
  }, [refreshCount, router]);

  const runOrQueue = useCallback(
    async <T,>(action: NewQueuedAction, directCall: () => Promise<T>) => {
      if (navigator.onLine) {
        try {
          await directCall();
          return { synced: true };
        } catch {
          // Échec réseau probable malgré navigator.onLine : on met en file.
        }
      }
      await enqueue(action);
      return { synced: false };
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    getQueue().then((q) => {
      if (cancelled) return;
      setPendingCount(q.length);
      // Corrige le statut réel juste après le montage (post-hydratation) —
      // voir le commentaire sur l'initialisation de `online` ci-dessus.
      // Appelé depuis ce callback .then (donc hors du corps synchrone de
      // l'effet) pour rester conforme à la règle react-hooks/set-state-in-effect.
      setOnline(navigator.onLine);
    });

    const handleOnline = () => {
      setOnline(true);
      flush();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const unsubscribe = onQueueChange(refreshCount);

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Ctx.Provider value={{ online, pendingCount, syncing, flush, runOrQueue }}>{children}</Ctx.Provider>
  );
}

export function useOffline(): OfflineState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOffline must be used within OfflineProvider");
  return ctx;
}
