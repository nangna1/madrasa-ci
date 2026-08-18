"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { markAttendance } from "@/lib/data/attendance";
import { useOffline } from "@/lib/offline/offline-context";
import { useLocale } from "@/components/locale-provider";
import { Toast, useToast } from "@/components/toast";

interface Row {
  id: string;
  fullName: string;
  parentPhone: string | null;
  present: boolean | null;
}

export default function AttendanceList({ students, date }: { students: Row[]; date: string }) {
  const router = useRouter();
  const { runOrQueue } = useOffline();
  const { message, flash } = useToast();
  const { t } = useLocale();
  const [local, setLocal] = useState(students);
  const [busyId, setBusyId] = useState<string | null>(null);

  const present = local.filter((s) => s.present === true).length;
  const absent = local.filter((s) => s.present === false).length;
  const unset = local.filter((s) => s.present === null).length;

  async function set(id: string, value: boolean) {
    const student = local.find((s) => s.id === id);
    setLocal((prev) => prev.map((s) => (s.id === id ? { ...s, present: value } : s)));
    setBusyId(id);

    const { synced } = await runOrQueue(
      {
        kind: "attendance",
        label: `${t("Présence")} · ${student?.fullName ?? ""}`,
        payload: { studentId: id, date, present: value },
      },
      async () => {
        const supabase = createClient();
        await markAttendance(supabase, id, date, value);
      },
    );

    setBusyId(null);
    flash(
      synced
        ? `${value ? t("Présence") : t("Absence")} ${t("enregistrée")} · ${student?.fullName ?? ""}`
        : t("Hors ligne · action enregistrée, envoi à la synchronisation"),
    );
    if (synced) router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <div className="font-serif text-2xl font-semibold text-ink">{t("Appel du jour")}</div>
        <div className="text-[13px] text-ink-muted">
          {t("{n} présents · {a} absents · {u} non renseignés", { n: present, a: absent, u: unset })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {local.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-2.5 rounded-xl border border-border-soft bg-card px-3 py-2.5"
          >
            <div className="flex-1 text-sm text-ink">{s.fullName}</div>
            <button
              onClick={() => set(s.id, true)}
              disabled={busyId === s.id}
              className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold ${
                s.present === true
                  ? "border-green bg-green text-card-alt"
                  : "border-border-input bg-card text-ink-muted"
              }`}
            >
              {t("Présent")}
            </button>
            <button
              onClick={() => set(s.id, false)}
              disabled={busyId === s.id}
              className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold ${
                s.present === false
                  ? "border-terracotta bg-terracotta text-card-alt"
                  : "border-border-input bg-card text-ink-muted"
              }`}
            >
              {t("Absent")}
            </button>
          </div>
        ))}
      </div>

      {absent > 0 && (
        <a
          href="/teacher/parents?template=absence"
          className="rounded-xl bg-green px-4 py-3.5 text-center text-sm font-semibold text-card-alt hover:bg-green-dark"
        >
          {t("Prévenir les parents des absents")}
        </a>
      )}

      <Toast message={message} />
    </div>
  );
}
