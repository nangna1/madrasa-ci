// Interface d'intégration mobile money. Aucune implémentation réelle tant
// que les comptes marchands Orange Money / MTN Money / Wave ne sont pas
// obtenus — voir supabase/seed_profiles.example.sql et le README pour le
// reste du provisioning. Remplacer `consolePaymentProvider` par un vrai
// provider par opérateur une fois les clés API disponibles.

export type MobileMoneyOperator = "Orange Money" | "MTN Money" | "Wave";

export interface PaymentRequest {
  operator: MobileMoneyOperator;
  parentPhone: string;
  amount: number;
  reference: string;
}

export interface PaymentProvider {
  requestPayment(req: PaymentRequest): Promise<{ ok: true } | { ok: false; error: string }>;
}

/**
 * TODO(intégration paiement réelle) : implémenter un provider par
 * opérateur (API Orange Money CI, MTN MoMo, Wave for Business) une fois les
 * comptes marchands créés. En attendant, cette implémentation journalise
 * la demande sans contacter d'API — l'encaissement est confirmé
 * manuellement côté UI par le maître, comme le fait le prototype.
 */
export const consolePaymentProvider: PaymentProvider = {
  async requestPayment(req) {
    console.info("[payment-provider:stub] demande de paiement", req);
    return { ok: true };
  },
};
