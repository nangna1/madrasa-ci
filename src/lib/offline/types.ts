import type { MemoStatus } from "@/lib/supabase/types";

export type QueuedAction =
  | {
      id: string;
      kind: "attendance";
      createdAt: number;
      label: string;
      payload: { studentId: string; date: string; present: boolean };
    }
  | {
      id: string;
      kind: "memorization";
      createdAt: number;
      label: string;
      payload: { studentId: string; sourateId: number; status: MemoStatus };
    }
  | {
      id: string;
      kind: "payment";
      createdAt: number;
      label: string;
      payload: { studentId: string; period: string; method: string };
    }
  | {
      id: string;
      kind: "message";
      createdAt: number;
      label: string;
      payload: { schoolId: string; studentId: string | null; toPhone: string; body: string; template?: string };
    };

export type NewQueuedAction =
  | Omit<Extract<QueuedAction, { kind: "attendance" }>, "id" | "createdAt">
  | Omit<Extract<QueuedAction, { kind: "memorization" }>, "id" | "createdAt">
  | Omit<Extract<QueuedAction, { kind: "payment" }>, "id" | "createdAt">
  | Omit<Extract<QueuedAction, { kind: "message" }>, "id" | "createdAt">;
