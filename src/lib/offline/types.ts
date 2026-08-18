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
      // La demande de paiement mobile money elle-même exige le réseau (voir
      // requestMobileMoneyPayment) et n'est donc jamais mise en file — seule
      // la confirmation qu'un paiement 'pending' a bien été reçu peut être
      // prise hors ligne puis rejouée.
      kind: "payment_confirm";
      createdAt: number;
      label: string;
      payload: { studentId: string; period: string };
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
  | Omit<Extract<QueuedAction, { kind: "payment_confirm" }>, "id" | "createdAt">
  | Omit<Extract<QueuedAction, { kind: "message" }>, "id" | "createdAt">;
