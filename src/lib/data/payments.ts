import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { MobileMoneyOperator, PaymentProvider } from "@/lib/providers/payment-provider";

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

// Étape 1 du paiement mobile money : envoie la demande à l'opérateur (via
// `provider`, un stub tant qu'aucun compte marchand n'est branché — voir
// src/lib/providers/payment-provider.ts) puis enregistre le paiement comme
// 'pending'. Exige d'être en ligne (voir payments-view.tsx) : contrairement
// aux autres actions de l'app, une demande mobile money est une interaction
// en temps réel avec le téléphone du parent, pas une simple écriture qui a
// du sens rejouée plus tard hors ligne.
export async function requestMobileMoneyPayment(
  supabase: SupabaseClient<Database>,
  provider: PaymentProvider,
  input: {
    studentId: string;
    period: string;
    operator: MobileMoneyOperator;
    parentPhone: string;
    amount: number;
  },
): Promise<Payment> {
  const result = await provider.requestPayment({
    operator: input.operator,
    parentPhone: input.parentPhone,
    amount: input.amount,
    reference: `${input.studentId}:${input.period}`,
  });
  if (!result.ok) throw new Error(result.error);

  const { data, error } = await supabase
    .from("payments")
    .upsert(
      {
        student_id: input.studentId,
        period: input.period,
        amount: input.amount,
        status: "pending",
        method: input.operator,
        receipt_no: null,
        paid_at: null,
      },
      { onConflict: "student_id,period" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Étape 2 : confirme qu'un paiement 'pending' a bien été reçu. Aujourd'hui
// déclenchée manuellement par l'enseignant (l'argent apparaît sur son
// compte mobile money, il confirme dans l'app) — c'est exactement ce que
// remplacera un webhook opérateur une fois les identifiants réels obtenus,
// sans rien changer côté app (même fonction, même écriture en base).
// Contrairement à la demande, une confirmation n'a pas besoin du réseau de
// l'opérateur : elle reste rejouable hors ligne via la file d'attente.
export async function confirmPayment(
  supabase: SupabaseClient<Database>,
  studentId: string,
  period: string,
): Promise<Payment> {
  const { data: receiptNo, error: receiptError } = await supabase.rpc("next_receipt_no");
  if (receiptError) throw receiptError;

  const { data, error } = await supabase
    .from("payments")
    .update({ status: "paid", receipt_no: receiptNo, paid_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .eq("period", period)
    .select()
    .single();
  if (error) throw error;
  return data;
}
