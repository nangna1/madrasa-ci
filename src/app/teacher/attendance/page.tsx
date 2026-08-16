import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getStudents } from "@/lib/data/students";
import { getAttendanceForDate, todayISO } from "@/lib/data/attendance";
import AttendanceList from "./attendance-list";

export default async function AttendancePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile?.school_id) redirect("/login");

  const students = await getStudents(supabase, profile.school_id);
  const date = todayISO();
  const attendance = await getAttendanceForDate(supabase, students.map((s) => s.id), date);

  const rows = students.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    parentPhone: s.parent_phone,
    present: attendance.get(s.id) ?? null,
  }));

  return <AttendanceList students={rows} date={date} />;
}
