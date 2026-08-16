"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { nextMemoStatus, setProgress } from "@/lib/data/memorization";
import { initials } from "@/lib/data/students";
import type { MemoStatus } from "@/lib/supabase/types";
import { useOffline } from "@/lib/offline/offline-context";
import { Toast, useToast } from "@/components/toast";

interface SourateRow {
  id: number;
  num: number;
  name: string;
  nameAr: string;
  status: MemoStatus;
}

const BADGE: Record<MemoStatus, { label: string; bg: string; fg: string }> = {
  ok: { label: "Mémorisé", bg: "var(--color-green-tint)", fg: "var(--color-green)" },
  wip: { label: "En cours", bg: "#FBEFD6", fg: "#8A6218" },
  todo: { label: "À venir", bg: "var(--color-paper-sunk)", fg: "var(--color-ink-faint)" },
};

export default function StudentDetail({
  student,
  sourates,
  memoCount,
  totalSourates,
  paid,
}: {
  student: { id: string; fullName: string; nameAr: string | null; meta: string };
  sourates: SourateRow[];
  memoCount: number;
  totalSourates: number;
  paid: boolean;
}) {
  const router = useRouter();
  const { runOrQueue } = useOffline();
  const { message, flash } = useToast();
  const [rows, setRows] = useState(sourates);

  async function cycle(row: SourateRow) {
    const next = nextMemoStatus(row.status);
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: next } : r)));

    const { synced } = await runOrQueue(
      {
        kind: "memorization",
        label: `${row.name} · ${student.fullName}`,
        payload: { studentId: student.id, sourateId: row.id, status: next },
      },
      async () => {
        const supabase = createClient();
        await setProgress(supabase, student.id, row.id, next);
      },
    );

    if (synced) {
      if (next === "ok") flash(`Sourate ${row.name} validée · ${student.fullName}`);
      router.refresh();
    } else {
      flash("Hors ligne · action enregistrée, envoi à la synchronisation");
    }
  }

  const progressPct = Math.round((memoCount / totalSourates) * 100);

  return (
    <div className="flex flex-col gap-[18px]">
      <Link href="/teacher/students" className="text-[13px] text-ink-muted">
        ‹ Retour
      </Link>

      <div className="flex items-center gap-3.5">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#EDE5D4] font-serif text-lg font-semibold text-ink-muted">
          {initials(student.fullName)}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="font-serif text-xl font-semibold text-ink">{student.fullName}</div>
          {student.nameAr && (
            <div dir="rtl" className="font-arabic text-[15px] text-ink-faint">
              {student.nameAr}
            </div>
          )}
          <div className="text-xs text-ink-muted">{student.meta}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-[14px] border border-border-soft bg-card p-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-[0.1em] text-ink-faint">Mémorisation</span>
          <span className="text-[13px] font-semibold text-green">
            {memoCount}/{totalSourates}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#E8E0CD]">
          <div className="h-full bg-green" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-[0.12em] text-ink-faint">Sourates</div>
        {rows.map((s) => {
          const badge = BADGE[s.status];
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-[11px] border border-border-soft px-3 py-2.5"
              style={{ background: s.status === "wip" ? "#FFFDF3" : "white" }}
            >
              <span className="w-[22px] text-xs text-[#A79E88]">{s.num}</span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm text-ink">{s.name}</span>
                <span dir="rtl" className="font-arabic text-sm text-ink-faint">
                  {s.nameAr}
                </span>
              </div>
              <button
                onClick={() => cycle(s)}
                className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold"
                style={{ background: badge.bg, color: badge.fg }}
              >
                {badge.label}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2.5">
        <Link
          href={`/teacher/parents?student=${student.id}&template=progres`}
          className="flex-1 rounded-[11px] border border-green py-3 text-center text-[13px] font-semibold text-green hover:bg-[#EFF4F0]"
        >
          Message au parent
        </Link>
        <Link
          href={paid ? "/teacher/payments" : `/teacher/payments?student=${student.id}`}
          className="flex-1 rounded-[11px] bg-green py-3 text-center text-[13px] font-semibold text-card-alt hover:bg-green-dark"
        >
          {paid ? "Voir le reçu" : "Encaisser"}
        </Link>
      </div>

      <Toast message={message} />
    </div>
  );
}
