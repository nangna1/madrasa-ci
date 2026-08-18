"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initials, createStudent } from "@/lib/data/students";

interface Row {
  id: string;
  fullName: string;
  nameAr: string;
  meta: string;
  paid: boolean;
  progress: number;
}

const emptyDraft = { fullName: "", nameAr: "", age: "", parentName: "", parentPhone: "" };

export default function StudentsList({
  students,
  total,
  totalSourates,
  schoolId,
  classId,
}: {
  students: Row[];
  total: number;
  totalSourates: number;
  schoolId: string;
  classId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const visible = q ? students.filter((s) => s.fullName.toLowerCase().includes(q)) : students;

  async function handleAdd() {
    if (!draft.fullName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      await createStudent(supabase, {
        schoolId,
        classId,
        fullName: draft.fullName.trim(),
        nameAr: draft.nameAr.trim(),
        age: draft.age ? Number(draft.age) : undefined,
        parentName: draft.parentName.trim(),
        parentPhone: draft.parentPhone.trim(),
      });
      setDraft(emptyDraft);
      setShowForm(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'ajout.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="font-serif text-2xl font-semibold text-ink">Élèves</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-ink-muted">{total} inscrits</div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg border border-green px-3 py-1.5 text-xs font-semibold text-green"
          >
            {showForm ? "Annuler" : "+ Ajouter un élève"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-green bg-[#F2F7F3] p-3.5">
          <input
            type="text"
            value={draft.fullName}
            onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
            placeholder="Nom complet *"
            className="rounded-lg border border-border-input bg-white px-2.5 py-2 text-sm text-ink"
          />
          <input
            type="text"
            value={draft.nameAr}
            onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })}
            placeholder="Nom en arabe (facultatif)"
            dir="rtl"
            className="font-arabic rounded-lg border border-border-input bg-white px-2.5 py-2 text-sm text-ink"
          />
          <div className="flex gap-2.5">
            <input
              type="number"
              value={draft.age}
              onChange={(e) => setDraft({ ...draft, age: e.target.value })}
              placeholder="Âge"
              className="w-24 rounded-lg border border-border-input bg-white px-2.5 py-2 text-sm text-ink"
            />
            <input
              type="text"
              value={draft.parentName}
              onChange={(e) => setDraft({ ...draft, parentName: e.target.value })}
              placeholder="Nom du parent"
              className="flex-1 rounded-lg border border-border-input bg-white px-2.5 py-2 text-sm text-ink"
            />
          </div>
          <input
            type="tel"
            value={draft.parentPhone}
            onChange={(e) => setDraft({ ...draft, parentPhone: e.target.value })}
            placeholder="Téléphone du parent (ex. 07 48 12 90)"
            className="rounded-lg border border-border-input bg-white px-2.5 py-2 text-sm text-ink"
          />
          {error && <div className="text-xs text-terracotta">{error}</div>}
          <button
            onClick={handleAdd}
            disabled={saving || !draft.fullName.trim()}
            className="rounded-lg bg-green py-2.5 text-sm font-semibold text-card-alt disabled:opacity-40"
          >
            {saving ? "Ajout…" : "Ajouter à la classe"}
          </button>
        </div>
      )}

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
