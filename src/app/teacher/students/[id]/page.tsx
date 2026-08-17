import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getStudent } from "@/lib/data/students";
import { getPaymentsForPeriod, currentPeriod } from "@/lib/data/payments";
import { getSourates, getProgressForStudent, TOTAL_SOURATES } from "@/lib/data/memorization";
import { getMyClass } from "@/lib/data/classes";
import StudentDetail from "./student-detail";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile?.school_id) redirect("/login");

  const myClass = await getMyClass(supabase);
  if (!myClass) redirect("/login");

  // La RLS (students_teacher_all) ne renvoie déjà que les élèves de la
  // classe de l'enseignant connecté : student === null ici couvre à la fois
  // "élève inexistant" et "élève d'une autre classe", sans distinction à faire.
  const student = await getStudent(supabase, id);
  if (!student) notFound();

  const [sourates, progress, payments] = await Promise.all([
    getSourates(supabase),
    getProgressForStudent(supabase, id),
    getPaymentsForPeriod(supabase, [id], currentPeriod()),
  ]);

  const memoCount = [...progress.values()].filter((s) => s === "ok").length;

  return (
    <StudentDetail
      student={{
        id: student.id,
        fullName: student.full_name,
        nameAr: student.name_ar,
        meta: `${myClass.name} · ${student.age ?? "?"} ans`,
      }}
      sourates={sourates.map((s) => ({
        id: s.id,
        num: s.num,
        name: s.name,
        nameAr: s.name_ar,
        status: progress.get(s.id) ?? "todo",
      }))}
      memoCount={memoCount}
      totalSourates={TOTAL_SOURATES}
      paid={payments.get(id)?.status === "paid"}
    />
  );
}
