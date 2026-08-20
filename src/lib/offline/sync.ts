import type { SupabaseClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import type { Database } from "@/lib/supabase/types";
import { getQueue, removeFromQueue } from "./queue";
import { markAttendance } from "@/lib/data/attendance";
import { setProgress } from "@/lib/data/memorization";
import { confirmPayment } from "@/lib/data/payments";
import { sendParentMessage } from "@/lib/data/messages";

export async function flushQueue(
  supabase: SupabaseClient<Database>,
): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue();
  let synced = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      switch (action.kind) {
        case "attendance":
          await markAttendance(
            supabase,
            action.payload.studentId,
            action.payload.date,
            action.payload.present,
          );
          break;
        case "memorization":
          await setProgress(
            supabase,
            action.payload.studentId,
            action.payload.sourateId,
            action.payload.status,
          );
          break;
        case "payment_confirm":
          await confirmPayment(supabase, action.payload.studentId, action.payload.period);
          break;
        case "message":
          await sendParentMessage(supabase, action.payload);
          break;
      }
      await removeFromQueue(action.id);
      synced++;
    } catch (err) {
      // Ce flush n'est appelé qu'au retour en ligne (voir offline-context.tsx)
      // : un échec ici n'est donc plus un simple "pas de réseau" mais
      // potentiellement un vrai bug (RLS, contrainte en base, etc.) — sans ce
      // log, l'action restait juste bloquée en file indéfiniment, sans aucune
      // piste pour comprendre pourquoi.
      console.error("offline sync: échec sur une action en file", action.kind, err);
      Sentry.captureException(err, { extra: { actionKind: action.kind, actionId: action.id } });
      failed++;
    }
  }

  return { synced, failed };
}
