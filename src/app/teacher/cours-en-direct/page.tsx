import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getMyClass, getScheduleSlots, formatHeure, jourIsoAujourdhui } from "@/lib/data/classes";
import { getStudents, initials } from "@/lib/data/students";
import { getAttendanceForDate, todayISO } from "@/lib/data/attendance";
import { getSourates, getProgressRows, nextSourateFor } from "@/lib/data/memorization";
import { getLiveReading } from "@/lib/data/liveReading";
import CoursEnDirectView from "./cours-en-direct-view";
import LiveReadingControl from "./live-reading-control";

export default async function CoursEnDirectPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile?.school_id) redirect("/login");

  const myClass = await getMyClass(supabase);
  if (!myClass) redirect("/login");

  const [students, sourates, slots] = await Promise.all([
    getStudents(supabase, myClass.id),
    getSourates(supabase),
    getScheduleSlots(supabase, myClass.id),
  ]);
  const studentIds = students.map((s) => s.id);
  const date = todayISO();

  const [attendance, progressRows, liveReading] = await Promise.all([
    getAttendanceForDate(supabase, studentIds, date),
    getProgressRows(supabase, studentIds),
    getLiveReading(supabase, myClass.id),
  ]);

  const rows = students.map((s) => {
    const nextSourate = nextSourateFor(sourates, progressRows.get(s.id));
    return {
      id: s.id,
      fullName: s.full_name,
      initials: initials(s.full_name),
      present: attendance.get(s.id) ?? null,
      nextSourate: nextSourate
        ? {
            id: nextSourate.id,
            num: nextSourate.num,
            name: nextSourate.name,
            nameAr: nextSourate.name_ar,
            status: progressRows.get(s.id)?.get(nextSourate.id) ?? "todo",
          }
        : null,
    };
  });

  const jourAujourdhui = jourIsoAujourdhui();
  const creneauxAujourdhui = slots.filter((s) => s.jour === jourAujourdhui);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/teacher" className="text-[13px] text-ink-muted">
        ‹ Retour
      </Link>

      <div className="flex flex-col gap-0.5">
        <div className="font-serif text-2xl font-semibold text-ink">Cours en direct</div>
        <div className="text-[13px] text-ink-muted">
          {myClass.name}
          {creneauxAujourdhui.length > 0
            ? " · " +
              creneauxAujourdhui
                .map((s) => `${s.subject?.name ?? "Matière non précisée"} (${formatHeure(s.heure_debut)}–${formatHeure(s.heure_fin)})`)
                .join(" · ")
            : " · pas de créneau aujourd'hui"}
        </div>
      </div>

      <LiveReadingControl classId={myClass.id} sourates={sourates} initialReading={liveReading} />

      <CoursEnDirectView students={rows} date={date} />
    </div>
  );
}
