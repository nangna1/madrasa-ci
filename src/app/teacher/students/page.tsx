import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getStudents } from "@/lib/data/students";
import { getPaymentsForPeriod, currentPeriod } from "@/lib/data/payments";
import { getProgressCounts, TOTAL_SOURATES } from "@/lib/data/memorization";
import { getMyClass } from "@/lib/data/classes";
import { getT } from "@/lib/i18n/server";
import StudentsList from "./students-list";

export default async function StudentsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile?.school_id) redirect("/login");
  const { t } = await getT();

  const myClass = await getMyClass(supabase);
  if (!myClass) redirect("/login");

  const students = await getStudents(supabase, myClass.id);
  const studentIds = students.map((s) => s.id);
  const [payments, progressCounts] = await Promise.all([
    getPaymentsForPeriod(supabase, studentIds, currentPeriod()),
    getProgressCounts(supabase, studentIds),
  ]);

  const rows = students.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    nameAr: s.name_ar ?? "",
    meta: t("{class} · {age} ans · parent {parent}", { class: myClass.name, age: s.age ?? "?", parent: s.parent_name ?? "—" }),
    paid: payments.get(s.id)?.status === "paid",
    progress: progressCounts.get(s.id) ?? 0,
  }));

  return (
    <StudentsList
      students={rows}
      total={students.length}
      totalSourates={TOTAL_SOURATES}
      schoolId={profile.school_id}
      classId={myClass.id}
    />
  );
}
