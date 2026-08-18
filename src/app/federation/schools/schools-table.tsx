"use client";

import { useState } from "react";
import type { SchoolAggregate } from "@/lib/data/federation";
import { consoleMessagingProvider } from "@/lib/providers/messaging-provider";
import { useLocale } from "@/components/locale-provider";

const STATUS_LABEL: Record<string, string> = {
  non_integree: "Non intégrée",
  en_cours: "En cours",
  integree: "Intégrée",
};
const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  non_integree: { bg: "var(--color-paper-sunk)", fg: "var(--color-ink-muted)" },
  en_cours: { bg: "#FBEFD6", fg: "#8A6218" },
  integree: { bg: "var(--color-green-tint)", fg: "var(--color-green)" },
};
const FILTERS = ["Toutes", "non_integree", "en_cours", "integree"] as const;

function recoveryColor(pct: number) {
  if (pct >= 75) return "var(--color-green)";
  if (pct >= 55) return "var(--color-gold)";
  return "var(--color-terracotta)";
}

// Hors du composant (comme avant l'ajout des traductions) : Date.now() est
// une fonction impure, la règle react-hooks/purity interdit de l'appeler
// depuis une fonction imbriquée dans le corps du composant — `t` est donc
// reçu en paramètre plutôt que capturé par closure.
function relativeDate(iso: string | null, t: (text: string, vars?: Record<string, string | number>) => string) {
  if (!iso) return t("aucune donnée");
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return t("aujourd'hui");
  if (days === 1) return t("hier");
  return t("il y a {n} j", { n: days });
}

export default function SchoolsTable({ rows }: { rows: SchoolAggregate[] }) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Toutes");
  const [drawer, setDrawer] = useState<SchoolAggregate | null>(null);
  const [contacted, setContacted] = useState(false);

  const q = query.trim().toLowerCase();
  const visible = rows.filter((r) => {
    if (filter !== "Toutes" && r.status !== filter) return false;
    if (q && !(r.name + " " + r.region).toLowerCase().includes(q)) return false;
    return true;
  });

  async function contact(school: SchoolAggregate) {
    if (!school.contactPhone) return;
    await consoleMessagingProvider.send({
      toPhone: school.contactPhone,
      body: t("Bonjour {name}, la fédération souhaite échanger avec vous.", { name: school.contactName ?? "" }),
    });
    setContacted(true);
    setTimeout(() => setContacted(false), 2600);
    setDrawer(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Rechercher une école…")}
          className="min-w-[240px] flex-1 rounded-[10px] border border-border-input bg-card px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-green"
        />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold ${
              filter === f
                ? "bg-green text-card-alt"
                : "border border-border-input bg-card text-ink-soft"
            }`}
          >
            {f === "Toutes" ? t("Toutes") : t(STATUS_LABEL[f])}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-[2.1fr_1.1fr_0.8fr_0.9fr_1.1fr_1fr] gap-3 border-b border-border bg-card-alt px-5 py-3.5 text-[11px] uppercase tracking-[0.1em] text-ink-faint">
          <span>{t("École")}</span>
          <span>{t("Région")}</span>
          <span>{t("Élèves")}</span>
          <span>{t("Statut")}</span>
          <span>{t("Recouvrement")}</span>
          <span>{t("Dernier paiement")}</span>
        </div>
        {visible.map((s) => {
          const status = STATUS_STYLE[s.status];
          return (
            <button
              key={s.id}
              onClick={() => setDrawer(s)}
              className="grid w-full grid-cols-[2.1fr_1.1fr_0.8fr_0.9fr_1.1fr_1fr] items-center gap-3 border-b border-[#EAE2CF] px-5 py-3.5 text-start text-[13.5px] last:border-b-0 hover:bg-[#F6F0E2]"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-ink">{s.name}</span>
                {s.nameAr && (
                  <span dir="rtl" className="font-arabic text-[12.5px] text-[#9A9280]">
                    {s.nameAr}
                  </span>
                )}
              </div>
              <span className="text-ink-soft">{s.region}</span>
              <span className="text-ink-soft">{s.studentsCount}</span>
              <span
                className="justify-self-start rounded-full px-2.5 py-1 text-[11.5px]"
                style={{ background: status.bg, color: status.fg }}
              >
                {t(STATUS_LABEL[s.status])}
              </span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8E0CD]">
                  <div
                    className="h-full"
                    style={{ width: `${s.recoveryPct}%`, background: recoveryColor(s.recoveryPct) }}
                  />
                </div>
                <span className="w-9 text-right text-xs text-ink-muted">{s.recoveryPct}%</span>
              </div>
              <span className="text-[12.5px] text-ink-muted">{relativeDate(s.lastActivity, t)}</span>
            </button>
          );
        })}
        {visible.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-ink-faint">{t("Aucune école ne correspond.")}</div>
        )}
      </div>
      <div className="text-[12.5px] text-ink-faint">
        {t("{visible} école(s) affichée(s) sur {total}", { visible: visible.length, total: rows.length })}
      </div>

      {drawer && (
        <div className="fixed inset-0 z-20 flex justify-end bg-black/40" onClick={() => setDrawer(null)}>
          <div
            className="flex h-full w-[430px] flex-col gap-5 overflow-y-auto border-s border-border-input bg-paper p-[26px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3.5">
              <div className="flex flex-col gap-1">
                <div className="font-serif text-xl font-semibold text-ink">{drawer.name}</div>
                {drawer.nameAr && (
                  <div dir="rtl" className="font-arabic text-sm text-ink-faint">
                    {drawer.nameAr}
                  </div>
                )}
                <div className="text-xs text-ink-muted">
                  {t("{region} · responsable {contact}", { region: drawer.region, contact: drawer.contactName ?? "—" })}
                </div>
              </div>
              <button onClick={() => setDrawer(null)} className="text-xl text-ink-faint">
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DrawerStat k={t("Élèves")} v={String(drawer.studentsCount)} />
              <DrawerStat k={t("Recouvrement")} v={`${drawer.recoveryPct}%`} />
              <DrawerStat k={t("Statut")} v={t(STATUS_LABEL[drawer.status])} />
              <DrawerStat k={t("Dernier paiement")} v={relativeDate(drawer.lastActivity, t)} />
            </div>

            <button
              onClick={() => contact(drawer)}
              disabled={!drawer.contactPhone}
              className="mt-auto rounded-[11px] border border-green py-3.5 text-center text-[13.5px] font-semibold text-green hover:bg-[#EFF4F0] disabled:opacity-50"
            >
              {t("Contacter le responsable")}
            </button>
          </div>
        </div>
      )}

      {contacted && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 rounded-[11px] bg-ink px-5 py-3 text-[13px] text-[#F5F1E6] shadow-lg">
          {t("Message envoyé au responsable sur WhatsApp")}
        </div>
      )}
    </div>
  );
}

function DrawerStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-card p-3.5">
      <div className="text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">{k}</div>
      <div className="mt-1.5 font-serif text-[22px] font-semibold text-ink">{v}</div>
    </div>
  );
}
