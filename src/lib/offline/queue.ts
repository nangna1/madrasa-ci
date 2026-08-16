import { get, set } from "idb-keyval";
import type { NewQueuedAction, QueuedAction } from "./types";

const KEY = "madrasa-ci:offline-queue";
const CHANGE_EVENT = "madrasa-ci:queue-changed";

function notifyChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onQueueChange(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}

export async function getQueue(): Promise<QueuedAction[]> {
  return (await get<QueuedAction[]>(KEY)) ?? [];
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
