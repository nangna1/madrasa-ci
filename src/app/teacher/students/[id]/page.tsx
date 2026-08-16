import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getStudent } from "@/lib/data/students";
import { getPaymentsForPeriod, currentPeriod } from "@/lib/data/payments";
import { getSourates, getProgressForStudent, TOTAL_SOURATES } from "@/lib/data/memorization";
import StudentDetail from "./student-detail";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile?.school_id) redirect("/login");

  const student = await getStudent(supabase, id);
  if (!student || student.school_id !== profile.school_id) notFound();

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
        meta: `${student.classe ?? "—"} · ${student.age ?? "?"} ans`,
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
