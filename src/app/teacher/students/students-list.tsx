"use client";

import { useState } from "react";
import Link from "next/link";
import { initials } from "@/lib/data/students";

interface Row {
  id: string;
  fullName: string;
  nameAr: string;
  meta: string;
  paid: boolean;
  progress: number;
}

export default function StudentsList({
  students,
  total,
  totalSourates,
}: {
  students: Row[];
  total: number;
  totalSourates: number;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = q ? students.filter((s) => s.fullName.toLowerCase().includes(q)) : students;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="font-serif text-2xl font-semibold text-ink">Élèves</div>
        </div>
        <div className="text-xs text-ink-muted">{total} inscrits</div>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un élève…"
        className="w-full rounded-[10px] border border-border-input bg-card px-3.5 py-2.5 text-sm text-ink outline-none focus:border-green"
      />

      <div className="flex flex-col gap-2">
        {visible.map((s) => (
          <Link
            key={s.id}
            href={`/teacher/students/${s.id}`}
            className="flex items-center gap-3 rounded-xl border border-border-soft bg-card px-3.5 py-3 hover:border-green"
          >
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#EDE5D4] font-serif text-sm font-semibold text-ink-muted">
              {initials(s.fullName)}
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-ink">{s.fullName}</span>
                {s.nameAr && (
                  <span dir="rtl" className="font-arabic text-[13px] text-[#9A9280]">
                    {s.nameAr}
                  </span>
                )}
              </div>
              <div className="text-xs text-ink-muted">{s.meta}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  s.paid ? "bg-green-tint text-green" : "bg-terracotta-tint text-terracotta"
                }`}
              >
                {s.paid ? "À jour" : "Impayé"}
              </span>
              <span className="text-[11px] text-ink-faint">
                {s.progress}/{totalSourates} sourates
              </span>
            </div>
          </Link>
        ))}
        {visible.length === 0 && (
          <div className="py-8 text-center text-sm text-ink-faint">Aucun élève trouvé.</div>
        )}
      </div>
    </div>
  );
}
