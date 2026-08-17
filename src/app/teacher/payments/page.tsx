import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getStudents } from "@/lib/data/students";
import { getPaymentsForPeriod, currentPeriod, MONTHLY_FEE } from "@/lib/data/payments";
import { getMyClass } from "@/lib/data/classes";
import PaymentsView from "./payments-view";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile?.school_id) redirect("/login");
  const { student: collectStudentId } = await searchParams;

  const myClass = await getMyClass(supabase);
  if (!myClass) redirect("/login");

  const students = await getStudents(supabase, myClass.id);
  const period = currentPeriod();
  const payments = await getPaymentsForPeriod(supabase, students.map((s) => s.id), period);

  const rows = students.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    parentPhone: s.parent_phone,
    parentName: s.parent_name,
    payment: payments.get(s.id)
      ? {
          status: payments.get(s.id)!.status,
          method: payments.get(s.id)!.method,
          receiptNo: payments.get(s.id)!.receipt_no,
        }
      : null,
  }));

  return (
    <PaymentsView
      students={rows}
      period={period}
      fee={MONTHLY_FEE}
      schoolId={profile.school_id}
      initialCollectId={collectStudentId}
    />
  );
}
