"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requestMobileMoneyPayment, confirmPayment, formatFcfa } from "@/lib/data/payments";
import { consolePaymentProvider, type MobileMoneyOperator } from "@/lib/providers/payment-provider";
import { sendParentMessage } from "@/lib/data/messages";
import { useOffline } from "@/lib/offline/offline-context";
import { useLocale } from "@/components/locale-provider";
import { Toast, useToast } from "@/components/toast";
import { intlTag } from "@/lib/i18n/types";

interface Row {
  id: string;
  fullName: string;
  parentPhone: string | null;
  parentName: string | null;
  payment: { status: string; method: string | null; receiptNo: string | null } | null;
}

const OPERATORS: { name: MobileMoneyOperator; color: string }[] = [
  { name: "Orange Money", color: "#E07A1F" },
  { name: "MTN Money", color: "#E4B95C" },
  { name: "Wave", color: "#2C6CD6" },
];

export default function PaymentsView({
  students,
  period,
  fee,
  schoolId,
  initialCollectId,
}: {
  students: Row[];
  period: string;
  fee: number;
  schoolId: string;
  initialCollectId?: string;
}) {
  const router = useRouter();
  const { online, runOrQueue } = useOffline();
  const { message, flash } = useToast();
  const { t, locale } = useLocale();
  const [rows, setRows] = useState(students);
  const [collectFor, setCollectFor] = useState<Row | null>(
    () =>
      students.find(
        (s) => s.id === initialCollectId && s.payment?.status !== "paid" && s.payment?.status !== "pending",
      ) ?? null,
  );
  const [operator, setOperator] = useState<MobileMoneyOperator>("Wave");
  const [receipt, setReceipt] = useState<{ studentId: string; no: string; rows: { k: string; v: string }[] } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const paidCount = rows.filter((s) => s.payment?.status === "paid").length;
  const collected = paidCount * fee;
  const expected = rows.length * fee;
  const collectedPct = expected > 0 ? Math.round((collected / expected) * 100) : 0;

  // Étape 1 : envoi de la demande à l'opérateur. Exige le réseau (voir
  // requestMobileMoneyPayment) — contrairement au reste de l'app, pas de
  // repli hors ligne possible ici, donc pas de runOrQueue.
  async function confirmCollect() {
    if (!collectFor || !online) return;
    const target = collectFor;
    if (!target.parentPhone) {
      setRequestError(t("Aucun numéro de téléphone parent enregistré pour cet élève."));
      return;
    }
    setBusy(true);
    setRequestError(null);
    try {
      const supabase = createClient();
      await requestMobileMoneyPayment(supabase, consolePaymentProvider, {
        studentId: target.id,
        period,
        operator,
        parentPhone: target.parentPhone,
        amount: fee,
      });
      setRows((prev) =>
        prev.map((s) =>
          s.id === target.id ? { ...s, payment: { status: "pending", method: operator, receiptNo: null } } : s,
        ),
      );
      setCollectFor(null);
      flash(t("Demande envoyée au {op} de {parent}", { op: operator, parent: target.parentName ?? t("parent") }));
      router.refresh();
    } catch (e) {
      setRequestError(e instanceof Error ? e.message : t("Échec de l'envoi de la demande."));
    } finally {
      setBusy(false);
    }
  }

  // Étape 2 : l'enseignant confirme que l'argent est bien arrivé (aujourd'hui
  // manuel, demain déclenché par le webhook de l'opérateur — même fonction).
  // Rejouable hors ligne : c'est une écriture de confirmation, pas un envoi
  // en temps réel vers un opérateur.
  async function confirmReceived(target: Row) {
    setBusy(true);

    const { synced } = await runOrQueue(
      {
        kind: "payment_confirm",
        label: `${t("Confirmation paiement")} · ${target.fullName}`,
        payload: { studentId: target.id, period },
      },
      async () => {
        const supabase = createClient();
        const payment = await confirmPayment(supabase, target.id, period);
        setReceipt({
          studentId: target.id,
          no: payment.receipt_no ?? "",
          rows: [
            { k: t("Élève"), v: target.fullName },
            { k: t("Période"), v: period },
            { k: t("Montant"), v: formatFcfa(fee) },
            { k: t("Moyen"), v: target.payment?.method ?? t("Mobile money") },
            { k: t("Date"), v: new Date().toLocaleDateString(intlTag(locale)) },
          ],
        });
      },
    );

    setBusy(false);

    if (synced) {
      router.refresh();
    } else {
      setRows((prev) =>
        prev.map((s) =>
          s.id === target.id ? { ...s, payment: { ...s.payment!, status: "paid", receiptNo: null } } : s,
        ),
      );
      flash(t("Hors ligne · confirmation enregistrée, reçu généré à la synchronisation"));
    }
  }

  function openReceipt(s: Row) {
    if (!s.payment) return;
    if (!s.payment.receiptNo) {
      flash(t("Reçu en attente de synchronisation"));
      return;
    }
    setReceipt({
      studentId: s.id,
      no: s.payment.receiptNo,
      rows: [
        { k: t("Élève"), v: s.fullName },
        { k: t("Période"), v: period },
        { k: t("Montant"), v: formatFcfa(fee) },
        { k: t("Moyen"), v: s.payment.method ?? t("Mobile money") },
      ],
    });
  }

  async function sendReceipt() {
    const student = rows.find((s) => s.id === receipt?.studentId);
    if (!student?.parentPhone) {
      setReceipt(null);
      return;
    }
    const receiptNo = receipt?.no ?? "";
    setReceipt(null);
    const body = t("Reçu de paiement {no} · {amount} · merci.", { no: receiptNo, amount: formatFcfa(fee) });

    const { synced } = await runOrQueue(
      {
        kind: "message",
        label: `${t("Reçu")} · ${student.fullName}`,
        payload: { schoolId, studentId: student.id, toPhone: student.parentPhone, body },
      },
      async () => {
        const supabase = createClient();
        await sendParentMessage(supabase, {
          schoolId,
          studentId: student.id,
          toPhone: student.parentPhone as string,
          body,
        });
      },
    );

    flash(synced ? t("Reçu envoyé sur WhatsApp au parent") : t("Hors ligne · envoi en attente de synchronisation"));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <div className="font-serif text-2xl font-semibold text-ink">{t("Mensualités")} · {period}</div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-[14px] bg-green p-4 text-card-alt">
        <div className="text-xs uppercase tracking-[0.1em] text-white/70">
          {t("Encaissé sur {expected} attendus", { expected: formatFcfa(expected) })}
        </div>
        <div className="font-serif text-[30px] font-semibold">{formatFcfa(collected)}</div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
          <div className="h-full bg-gold" style={{ width: `${collectedPct}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((s) => {
          const status = s.payment?.status;
          const paid = status === "paid";
          const pending = status === "pending";
          const pendingSync = paid && !s.payment?.receiptNo;
          return (
            <div
              key={s.id}
              className="flex items-center gap-2.5 rounded-xl border border-border-soft bg-card px-3.5 py-3"
            >
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="text-sm font-semibold text-ink">{s.fullName}</div>
                <div className="text-xs text-ink-muted">
                  {paid &&
                    `${pendingSync ? t("Payé (à synchroniser)") : t("Payé")} · ${s.payment?.method} · ${formatFcfa(fee)}`}
                  {pending && t("En attente · demande envoyée sur {op} · {amount}", { op: s.payment?.method ?? "", amount: formatFcfa(fee) })}
                  {!paid && !pending && t("Dû · {amount} · parent {phone}", { amount: formatFcfa(fee), phone: s.parentPhone ?? "—" })}
                </div>
              </div>
              <button
                onClick={() => (paid ? openReceipt(s) : pending ? confirmReceived(s) : setCollectFor(s))}
                disabled={busy}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold disabled:opacity-60 ${
                  paid
                    ? "border border-green text-green"
                    : pending
                      ? "border border-gold text-gold"
                      : "bg-green text-card-alt"
                }`}
              >
                {paid ? t("Reçu") : pending ? t("Confirmer la réception") : t("Encaisser")}
              </button>
            </div>
          );
        })}
      </div>

      {collectFor && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/45" onClick={() => setCollectFor(null)}>
          <div
            className="mx-auto w-full max-w-[480px] rounded-t-2xl bg-paper px-5 pb-6 pt-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="font-serif text-lg font-semibold text-ink">{t("Encaisser")} · {collectFor.fullName}</div>
                <div className="text-[13px] text-ink-muted">
                  {t("Mensualité {period}", { period })} · {formatFcfa(fee)}
                </div>
              </div>
              <button onClick={() => setCollectFor(null)} className="text-lg text-ink-faint">
                ×
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {OPERATORS.map((o) => (
                <button
                  key={o.name}
                  onClick={() => setOperator(o.name)}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-start ${
                    operator === o.name ? "border-green bg-[#F2F7F3]" : "border-border-soft bg-card"
                  }`}
                >
                  <span className="h-[30px] w-[30px] shrink-0 rounded-lg" style={{ background: o.color }} />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-ink">{o.name}</span>
                    <span className="text-xs text-ink-muted">
                      {collectFor.parentPhone ?? t("Pas de numéro enregistré")} · {collectFor.parentName}
                    </span>
                  </div>
                  {operator === o.name && <span className="text-sm text-green">✓</span>}
                </button>
              ))}
            </div>

            {!online && (
              <div className="mt-3 rounded-lg bg-terracotta-tint px-3 py-2.5 text-xs text-terracotta">
                {t("Connexion requise pour envoyer la demande à l'opérateur — réessayez une fois en ligne.")}
              </div>
            )}
            {requestError && <div className="mt-3 text-xs text-terracotta">{requestError}</div>}

            <button
              onClick={confirmCollect}
              disabled={busy || !online}
              className="mt-4 w-full rounded-xl bg-green py-3.5 text-sm font-semibold text-card-alt hover:bg-green-dark disabled:opacity-60"
            >
              {busy ? t("Envoi…") : t("Demander le paiement")}
            </button>
            <div className="mt-2.5 text-center text-[11.5px] text-ink-faint">
              {t("Le parent reçoit une demande sur son téléphone. Une fois l'argent reçu, confirmez dans l'app pour générer le reçu.")}
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/45 p-6" onClick={() => setReceipt(null)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-border-soft bg-[#FFFDF7] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3.5 flex flex-col items-center gap-1.5 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-tint text-lg text-green">
                ✓
              </div>
              <div className="font-serif text-lg font-semibold text-ink">{t("Paiement reçu")}</div>
              <div className="text-xs text-ink-muted">{receipt.no}</div>
            </div>
            <div className="flex flex-col gap-2.5 border-y border-dashed border-border-input py-3.5">
              {receipt.rows.map((r) => (
                <div key={r.k} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-ink-muted">{r.k}</span>
                  <span className="font-semibold text-ink">{r.v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3.5 flex gap-2.5">
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 rounded-lg border border-border-input py-2.5 text-xs font-semibold text-ink-soft"
              >
                {t("Fermer")}
              </button>
              <button
                onClick={sendReceipt}
                className="flex-1 rounded-lg bg-green py-2.5 text-xs font-semibold text-card-alt"
              >
                {t("Envoyer au parent")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={message} />
    </div>
  );
}
