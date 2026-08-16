import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export const MONTHLY_FEE = 3000;

export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatFcfa(amount: number): string {
  return amount.toLocaleString("fr-FR").replace(/\s/g, " ") + " FCFA";
}

export async function getPaymentsForPeriod(
  supabase: SupabaseClient<Database>,
  studentIds: string[],
  period: string,
): Promise<Map<string, Payment>> {
  if (studentIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .in("student_id", studentIds)
    .eq("period", period);
  if (error) throw error;
  return new Map(data.map((r) => [r.student_id, r]));
}

export async function recordPayment(
  supabase: SupabaseClient<Database>,
  studentId: string,
  period: string,
  method: string,
): Promise<Payment> {
  const { data: receiptNo, error: receiptError } = await supabase.rpc("next_receipt_no");
  if (receiptError) throw receiptError;

  const { data, error } = await supabase
    .from("payments")
    .upsert(
      {
        student_id: studentId,
        period,
        amount: MONTHLY_FEE,
        status: "paid",
        method,
        receipt_no: receiptNo,
        paid_at: new Date().toISOString(),
      },
      { onConflict: "student_id,period" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
