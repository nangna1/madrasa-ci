import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getStudents } from "@/lib/data/students";
import { MESSAGE_TEMPLATES } from "@/lib/data/messages";
import ParentsView from "./parents-view";

export default async function ParentsPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; student?: string }>;
}) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile?.school_id) redirect("/login");

  const students = await getStudents(supabase, profile.school_id);
  const { template, student } = await searchParams;

  const initialTemplateIndex =
    template === "absence"
      ? MESSAGE_TEMPLATES.findIndex((t) => t.label === "Absence")
      : template === "progres"
        ? MESSAGE_TEMPLATES.findIndex((t) => t.label === "Progrès Coran")
        : 0;

  const scoped = student ? students.filter((s) => s.id === student) : students;
  const recipients = scoped
    .filter((s) => s.parent_phone)
    .map((s) => ({ studentId: s.id, phone: s.parent_phone as string }));

  return (
    <ParentsView
      schoolId={profile.school_id}
      recipients={recipients}
      templates={MESSAGE_TEMPLATES}
      initialTemplateIndex={Math.max(initialTemplateIndex, 0)}
    />
  );
}
