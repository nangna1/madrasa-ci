"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminRow } from "@/app/actions/admin-management";
import { setAdminSuspended } from "@/app/actions/admin-management";
import { useLocale } from "@/components/locale-provider";

export default function AdminsTable({ rows }: { rows: AdminRow[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(row: AdminRow) {
    setPendingId(row.id);
    setError(null);
    const res = await setAdminSuspended(row.id, !row.suspended);
    setPendingId(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <div className="text-sm text-terracotta">{error}</div>}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-[1.6fr_1.4fr_1fr_0.8fr_auto] gap-3 border-b border-border bg-card-alt px-5 py-3.5 text-[11px] uppercase tracking-[0.1em] text-ink-faint">
          <span>{t("Enseignant")}</span>
          <span>{t("Fédération")}</span>
          <span>{t("Téléphone (ex. 07 48 12 90)")}</span>
          <span>{t("Statut")}</span>
          <span />
        </div>
        {rows.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-[1.6fr_1.4fr_1fr_0.8fr_auto] items-center gap-3 border-b border-[#EAE2CF] px-5 py-3.5 text-[13.5px] last:border-b-0"
          >
            <span className="font-semibold text-ink">{r.fullName}</span>
            <span className="text-ink-soft">{r.federationName ?? "—"}</span>
            <span className="text-ink-soft">{r.phone ?? "—"}</span>
            <span
              className="justify-self-start rounded-full px-2.5 py-1 text-[11.5px]"
              style={
                r.suspended
                  ? { background: "var(--color-terracotta-tint)", color: "var(--color-terracotta)" }
                  : { background: "var(--color-green-tint)", color: "var(--color-green)" }
              }
            >
              {r.suspended ? t("Suspendu") : t("Actif")}
            </span>
            <button
              onClick={() => toggle(r)}
              disabled={pendingId === r.id}
              className={`justify-self-end rounded-[9px] border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                r.suspended
                  ? "border-green text-green hover:bg-[#EFF4F0]"
                  : "border-terracotta text-terracotta hover:bg-[#FBEFE9]"
              }`}
            >
              {pendingId === r.id ? t("Chargement…") : r.suspended ? t("Réactiver") : t("Suspendre")}
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-ink-faint">{t("Aucun compte admin pour l'instant.")}</div>
        )}
      </div>
    </div>
  );
}
