import { get, set, del } from "idb-keyval";
import type { NewQueuedAction, QueuedAction } from "./types";

const KEY = "scolaris:offline-queue";
const OLD_KEY = "madrasa-ci:offline-queue"; // rétrocompatibilité (renommage Madrasa CI -> Scolaris, 2026-08-19)
const CHANGE_EVENT = "scolaris:queue-changed";

function notifyChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onQueueChange(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}

export async function getQueue(): Promise<QueuedAction[]> {
  const current = await get<QueuedAction[]>(KEY);
  if (current) return current;
  // Un appareil qui avait des actions en attente au moment du renommage ne
  // doit pas les perdre silencieusement : on les récupère une fois depuis
  // l'ancienne clé, puis on migre pour de bon.
  const legacy = await get<QueuedAction[]>(OLD_KEY);
  if (legacy && legacy.length > 0) {
    await set(KEY, legacy);
    await del(OLD_KEY);
    return legacy;
  }
  return [];
}

export async function enqueue(action: NewQueuedAction): Promise<QueuedAction> {
  const queue = await getQueue();
  const entry = { ...action, id: crypto.randomUUID(), createdAt: Date.now() } as QueuedAction;
  queue.push(entry);
  await set(KEY, queue);
  notifyChange();
  return entry;
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  await set(
    KEY,
    queue.filter((a) => a.id !== id),
  );
  notifyChange();
}
