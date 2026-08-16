import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getQueue, removeFromQueue } from "./queue";
import { markAttendance } from "@/lib/data/attendance";
import { setProgress } from "@/lib/data/memorization";
import { recordPayment } from "@/lib/data/payments";
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
        case "payment":
          await recordPayment(
            supabase,
            action.payload.studentId,
            action.payload.period,
            action.payload.method,
          );
          break;
        case "message":
          await sendParentMessage(supabase, action.payload);
          break;
      }
      await removeFromQueue(action.id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
