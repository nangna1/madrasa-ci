"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { markAttendance } from "@/lib/data/attendance";
import { nextMemoStatus, setProgress } from "@/lib/data/memorization";
import { useOffline } from "@/lib/offline/offline-context";
import { Toast, useToast } from "@/components/toast";
import type { MemoStatus } from "@/lib/supabase/types";

interface NextSourate {
  id: number;
  num: number;
  name: string;
  nameAr: string;
  status: MemoStatus;
}

interface Row {
  id: string;
  fullName: string;
  initials: string;
  present: boolean | null;
  nextSourate: NextSourate | null;
}

const BADGE: Record<MemoStatus, { label: string; bg: string; fg: string }> = {
  ok: { label: "Mémorisé", bg: "var(--color-green-tint)", fg: "var(--color-green)" },
  wip: { label: "En cours", bg: "#FBEFD6", fg: "#8A6218" },
  todo: { label: "À venir", bg: "var(--color-paper-sunk)", fg: "var(--color-ink-faint)" },
};

export default function CoursEnDirectView({ students, date }: { students: Row[]; date: string }) {
  const router = useRouter();
  const { runOrQueue } = useOffline();
  const { message, flash } = useToast();
  const [rows, setRows] = useState(students);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleAttendance(row: Row, present: boolean) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, present } : r)));
    setBusyId(row.id);

    const { synced } = await runOrQueue(
      {
        kind: "attendance",
        label: `Présence · ${row.fullName}`,
        payload: { studentId: row.id, date, present },
      },
      async () => {
        const supabase = createClient();
        await markAttendance(supabase, row.id, date, present);
      },
    );

    setBusyId(null);
    if (!synced) flash("Hors ligne · présence enregistrée, envoi à la synchronisation");
    if (synced) router.refresh();
  }

  async function cycleSourate(row: Row) {
    if (!row.nextSourate) return;
    const sourate = row.nextSourate;
    const next = nextMemoStatus(sourate.status);
    setRows((prev) =>
      prev.map((r) => (r.id === row.id && r.nextSourate ? { ...r, nextSourate: { ...r.nextSourate, status: next } } : r)),
    );
    setBusyId(row.id);

    const { synced } = await runOrQueue(
      {
        kind: "memorization",
        label: `${sourate.name} · ${row.fullName}`,
        payload: { studentId: row.id, sourateId: sourate.id, status: next },
      },
      async () => {
        const supabase = createClient();
        await setProgress(supabase, row.id, sourate.id, next);
      },
    );

    setBusyId(null);
    if (synced) {
      if (next === "ok") flash(`Sourate ${sourate.name} validée · ${row.fullName}`);
      router.refresh();
    } else {
      flash("Hors ligne · action enregistrée, envoi à la synchronisation");
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => {
        const badge = row.nextSourate ? BADGE[row.nextSourate.status] : null;
        return (
          <div key={row.id} className="flex flex-col gap-2.5 rounded-[14px] border border-border-soft bg-card p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE5D4] font-serif text-[13px] font-semibold text-ink-muted">
                {row.initials}
              </div>
              <Link href={`/teacher/students/${row.id}`} className="flex-1 text-sm font-semibold text-ink">
                {row.fullName}
              </Link>
              <button
                onClick={() => toggleAttendance(row, true)}
                disabled={busyId === row.id}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
                  row.present === true ? "border-green bg-green text-card-alt" : "border-border-input bg-white text-ink-muted"
                }`}
              >
                Présent
              </button>
              <button
                onClick={() => toggleAttendance(row, false)}
                disabled={busyId === row.id}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
                  row.present === false ? "border-terracotta bg-terracotta text-card-alt" : "border-border-input bg-white text-ink-muted"
                }`}
              >
                Absent
              </button>
            </div>

            {row.nextSourate && badge ? (
              <button
                onClick={() => cycleSourate(row)}
                disabled={busyId === row.id}
                className="flex items-center justify-between gap-2 rounded-[10px] bg-white px-3 py-2"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-[10px] uppercase tracking-[0.08em] text-ink-faint">Prochaine sourate</span>
                  <span className="text-sm text-ink">
                    {row.nextSourate.num}. {row.nextSourate.name}
                  </span>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: badge.bg, color: badge.fg }}>
                  {badge.label}
                </span>
              </button>
            ) : (
              <div className="rounded-[10px] bg-white px-3 py-2 text-center text-[13px] text-green">
                🎉 Coran mémorisé en entier
              </div>
            )}
          </div>
        );
      })}

      <Toast message={message} />
    </div>
  );
}
