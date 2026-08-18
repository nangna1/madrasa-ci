"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  addClassSubject,
  removeClassSubject,
  CATEGORY_LABEL,
  type Subject,
  type ClassSubject,
} from "@/lib/data/subjects";
import { addScheduleSlot, removeScheduleSlot, formatHeure, JOURS_SEMAINE } from "@/lib/data/classes";
import type { ScheduleSlotWithSubject } from "@/lib/data/classes";
import type { SubjectCategory } from "@/lib/supabase/types";
import { useLocale } from "@/components/locale-provider";

const CATEGORIES: SubjectCategory[] = ["coranique", "national"];

export default function EmploiDuTempsView({
  classId,
  className,
  initialSlots,
  catalog,
  initialClassSubjects,
}: {
  classId: string;
  className: string;
  initialSlots: ScheduleSlotWithSubject[];
  catalog: Subject[];
  initialClassSubjects: (ClassSubject & { subject: Subject })[];
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [classSubjects, setClassSubjects] = useState(initialClassSubjects);
  const [slots, setSlots] = useState(initialSlots);
  const [busySubject, setBusySubject] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotJour, setSlotJour] = useState(1);
  const [slotDebut, setSlotDebut] = useState("08:00");
  const [slotFin, setSlotFin] = useState("10:00");
  const [slotMatiere, setSlotMatiere] = useState("");
  const [savingSlot, setSavingSlot] = useState(false);

  const activeCodes = new Set(classSubjects.map((cs) => cs.subject_code));

  async function toggleSubject(subject: Subject) {
    setError(null);
    setBusySubject(subject.code);
    const supabase = createClient();
    try {
      const existing = classSubjects.find((cs) => cs.subject_code === subject.code);
      if (existing) {
        await removeClassSubject(supabase, existing.id);
        setClassSubjects((prev) => prev.filter((cs) => cs.id !== existing.id));
        // Une matière retirée ne peut plus être référencée par les créneaux :
        // on les détache localement (la contrainte FK côté base l'exigerait
        // de toute façon si on la forçait, ici on garde juste l'UI cohérente).
        setSlots((prev) =>
          prev.map((s) => (s.subject_code === subject.code ? { ...s, subject_code: null, subject: null } : s)),
        );
      } else {
        await addClassSubject(supabase, classId, subject.code);
        setClassSubjects((prev) => [...prev, { id: crypto.randomUUID(), class_id: classId, subject_code: subject.code, teacher_id: null, created_at: new Date().toISOString(), subject }]);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Erreur lors de la mise à jour."));
    } finally {
      setBusySubject(null);
    }
  }

  async function handleAddSlot() {
    if (slotFin <= slotDebut) {
      setError(t("L'heure de fin doit être après l'heure de début."));
      return;
    }
    setSavingSlot(true);
    setError(null);
    const supabase = createClient();
    try {
      await addScheduleSlot(supabase, {
        classId,
        jour: slotJour,
        heureDebut: slotDebut,
        heureFin: slotFin,
        subjectCode: slotMatiere || null,
      });
      router.refresh();
      setShowSlotForm(false);
      setSlotMatiere("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Erreur lors de l'ajout du créneau."));
    } finally {
      setSavingSlot(false);
    }
  }

  async function handleRemoveSlot(slotId: string) {
    setError(null);
    const supabase = createClient();
    try {
      await removeScheduleSlot(supabase, slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Erreur lors de la suppression."));
    }
  }

  const parJour = new Map<number, ScheduleSlotWithSubject[]>();
  for (const slot of slots) {
    parJour.set(slot.jour, [...(parJour.get(slot.jour) ?? []), slot]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <div className="text-xs uppercase tracking-[0.12em] text-ink-faint">{t("Matières enseignées")}</div>
        {CATEGORIES.map((cat) => {
          const items = catalog.filter((s) => s.category === cat);
          return (
            <div key={cat} className="flex flex-col gap-1.5">
              <div className="text-[11px] font-semibold text-ink-muted">{t(CATEGORY_LABEL[cat])}</div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((subject) => {
                  const active = activeCodes.has(subject.code);
                  return (
                    <button
                      key={subject.code}
                      onClick={() => toggleSubject(subject)}
                      disabled={busySubject === subject.code}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-opacity ${
                        active ? "bg-green text-card-alt" : "border border-border-input bg-card text-ink-soft"
                      } ${busySubject === subject.code ? "opacity-50" : ""}`}
                    >
                      {active ? "✓ " : "+ "}
                      {subject.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.12em] text-ink-faint">{t("Emploi du temps")} · {className}</div>
          <button onClick={() => setShowSlotForm((v) => !v)} className="text-xs font-semibold text-green">
            {showSlotForm ? t("Annuler") : t("+ Créneau")}
          </button>
        </div>

        {showSlotForm && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-border-soft bg-card p-3.5">
            <select
              value={slotJour}
              onChange={(e) => setSlotJour(Number(e.target.value))}
              className="rounded-lg border border-border-input bg-white px-2.5 py-2 text-sm text-ink"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <option key={j} value={j}>
                  {t(JOURS_SEMAINE[j])}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="time"
                value={slotDebut}
                onChange={(e) => setSlotDebut(e.target.value)}
                className="flex-1 rounded-lg border border-border-input bg-white px-2.5 py-2 text-sm text-ink"
              />
              <input
                type="time"
                value={slotFin}
                onChange={(e) => setSlotFin(e.target.value)}
                className="flex-1 rounded-lg border border-border-input bg-white px-2.5 py-2 text-sm text-ink"
              />
            </div>
            <select
              value={slotMatiere}
              onChange={(e) => setSlotMatiere(e.target.value)}
              className="rounded-lg border border-border-input bg-white px-2.5 py-2 text-sm text-ink"
            >
              <option value="">{t("— Matière non précisée —")}</option>
              {classSubjects.map((cs) => (
                <option key={cs.subject_code} value={cs.subject_code}>
                  {cs.subject.name}
                </option>
              ))}
            </select>
            {classSubjects.length === 0 && (
              <div className="text-xs text-ink-faint">{t("Activez au moins une matière ci-dessus pour pouvoir la choisir ici.")}</div>
            )}
            <button
              onClick={handleAddSlot}
              disabled={savingSlot}
              className="rounded-lg bg-green py-2.5 text-center text-sm font-semibold text-card-alt disabled:opacity-60"
            >
              {savingSlot ? t("Ajout…") : t("Ajouter au planning")}
            </button>
          </div>
        )}

        {[1, 2, 3, 4, 5, 6, 7].map((jour) => {
          const creneaux = parJour.get(jour) ?? [];
          return (
            <div key={jour} className="flex flex-col gap-1.5 rounded-xl border border-border-soft bg-card px-3.5 py-3">
              <div className="text-sm font-semibold text-ink">{t(JOURS_SEMAINE[jour])}</div>
              {creneaux.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {creneaux.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-ink-soft">
                          {formatHeure(s.heure_debut)} – {formatHeure(s.heure_fin)}
                        </span>
                        <span className="text-[11px] text-ink-faint">{s.subject?.name ?? t("Matière non précisée")}</span>
                      </div>
                      <button onClick={() => handleRemoveSlot(s.id)} className="text-xs text-terracotta">
                        {t("Retirer")}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-ink-faint">—</div>
              )}
            </div>
          );
        })}
      </div>

      {error && <div className="text-center text-xs text-terracotta">{error}</div>}
    </div>
  );
}
