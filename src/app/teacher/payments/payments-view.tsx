"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordPayment, formatFcfa } from "@/lib/data/payments";
import { sendParentMessage } from "@/lib/data/messages";
import { useOffline } from "@/lib/offline/offline-context";
import { Toast, useToast } from "@/components/toast";

interface Row {
  id: string;
  fullName: string;
  parentPhone: string | null;
  parentName: string | null;
  payment: { status: string; method: string | null; receiptNo: string | null } | null;
}

const OPERATORS: { name: string; color: string }[] = [
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
  const { runOrQueue } = useOffline();
  const { message, flash } = useToast();
  const [rows, setRows] = useState(students);
  const [collectFor, setCollectFor] = useState<Row | null>(
    () => students.find((s) => s.id === initialCollectId && s.payment?.status !== "paid") ?? null,
  );
  const [operator, setOperator] = useState("Wave");
  const [receipt, setReceipt] = useState<{ studentId: string; no: string; rows: { k: string; v: string }[] } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const paidCount = rows.filter((s) => s.payment?.status === "paid").length;
  const collected = paidCount * fee;
  const expected = rows.length * fee;
  const collectedPct = expected > 0 ? Math.round((collected / expected) * 100) : 0;

  async function confirmCollect() {
    if (!collectFor) return;
    const target = collectFor;
    setBusy(true);
    setCollectFor(null);

    const { synced } = await runOrQueue(
      {
        kind: "payment",
        label: `Encaissement · ${target.fullName}`,
        payload: { studentId: target.id, period, method: operator },
      },
      async () => {
        const supabase = createClient();
        const payment = await recordPayment(supabase, target.id, period, operator);
        setReceipt({
          studentId: target.id,
          no: payment.receipt_no ?? "",
          rows: [
            { k: "Élève", v: target.fullName },
            { k: "Période", v: period },
            { k: "Montant", v: formatFcfa(fee) },
            { k: "Moyen", v: operator },
            { k: "Date", v: new Date().toLocaleDateString("fr-FR") },
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
          s.id === target.id ? { ...s, payment: { status: "paid", method: operator, receiptNo: null } } : s,
        ),
      );
      flash("Hors ligne · encaissement enregistré, reçu généré à la synchronisation");
    }
  }

  function openReceipt(s: Row) {
    if (!s.payment) return;
    if (!s.payment.receiptNo) {
      flash("Reçu en attente de synchronisation");
      return;
    }
    setReceipt({
      studentId: s.id,
      no: s.payment.receiptNo,
      rows: [
        { k: "Élève", v: s.fullName },
        { k: "Période", v: period },
        { k: "Montant", v: formatFcfa(fee) },
        { k: "Moyen", v: s.payment.method ?? "Mobile money" },
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

    const { synced } = await runOrQueue(
      {
        kind: "message",
        label: `Reçu · ${student.fullName}`,
        payload: {
          schoolId,
          studentId: student.id,
          toPhone: student.parentPhone,
          body: `Reçu de paiement ${receiptNo} · ${formatFcfa(fee)} · merci.`,
        },
      },
      async () => {
        const supabase = createClient();
        await sendParentMessage(supabase, {
          schoolId,
          studentId: student.id,
          toPhone: student.parentPhone as string,
          body: `Reçu de paiement ${receiptNo} · ${formatFcfa(fee)} · merci.`,
        });
      },
    );

    flash(synced ? "Reçu envoyé sur WhatsApp au parent" : "Hors ligne · envoi en attente de synchronisation");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <div className="font-serif text-2xl font-semibold text-ink">Mensualités · {period}</div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-[14px] bg-green p-4 text-card-alt">
        <div className="text-xs uppercase tracking-[0.1em] text-white/70">
          Encaissé sur {formatFcfa(expected)} attendus
        </div>
        <div className="font-serif text-[30px] font-semibold">{formatFcfa(collected)}</div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
          <div className="h-full bg-gold" style={{ width: `${collectedPct}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((s) => {
          const paid = s.payment?.status === "paid";
          const pendingSync = paid && !s.payment?.receiptNo;
          return (
            <div
              key={s.id}
              className="flex items-center gap-2.5 rounded-xl border border-border-soft bg-card px-3.5 py-3"
            >
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="text-sm font-semibold text-ink">{s.fullName}</div>
                <div className="text-xs text-ink-muted">
                  {paid
                    ? `${pendingSync ? "Payé (à synchroniser)" : "Payé"} · ${s.payment?.method} · ${formatFcfa(fee)}`
                    : `Dû · ${formatFcfa(fee)} · parent ${s.parentPhone ?? "—"}`}
                </div>
              </div>
              <button
                onClick={() => (paid ? openReceipt(s) : setCollectFor(s))}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold ${
                  paid ? "border border-green text-green" : "bg-green text-card-alt"
                }`}
              >
                {paid ? "Reçu" : "Encaisser"}
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
                <div className="font-serif text-lg font-semibold text-ink">Encaisser · {collectFor.fullName}</div>
                <div className="text-[13px] text-ink-muted">
                  Mensualité {period} · {formatFcfa(fee)}
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
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left ${
                    operator === o.name ? "border-green bg-[#F2F7F3]" : "border-border-soft bg-card"
                  }`}
                >
                  <span className="h-[30px] w-[30px] rounded-lg" style={{ background: o.color }} />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-ink">{o.name}</span>
                    <span className="text-xs text-ink-muted">
                      {collectFor.parentPhone} · {collectFor.parentName}
                    </span>
                  </div>
                  {operator === o.name && <span className="text-sm text-green">✓</span>}
                </button>
              ))}
            </div>
            <button
              onClick={confirmCollect}
              disabled={busy}
              className="mt-4 w-full rounded-xl bg-green py-3.5 text-sm font-semibold text-card-alt hover:bg-green-dark disabled:opacity-60"
            >
              {busy ? "Envoi…" : "Demander le paiement"}
            </button>
            <div className="mt-2.5 text-center text-[11.5px] text-ink-faint">
              Le parent reçoit une demande sur son téléphone. Reçu généré automatiquement.
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
              <div className="font-serif text-lg font-semibold text-ink">Paiement reçu</div>
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
                Fermer
              </button>
              <button
                onClick={sendReceipt}
                className="flex-1 rounded-lg bg-green py-2.5 text-xs font-semibold text-card-alt"
              >
                Envoyer au parent
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={message} />
    </div>
  );
}
