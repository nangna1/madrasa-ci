import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getSchool } from "@/lib/data/schools";
import TeacherShell from "./teacher-shell";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Madrasa CI" },
};

export const viewport: Viewport = {
  themeColor: "#1F6B4A",
};

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role !== "teacher" || !profile.school_id) redirect("/login");

  const school = await getSchool(supabase, profile.school_id);
  if (!school) redirect("/login");

  return (
    <TeacherShell schoolName={school.name} teacherName={profile.full_name}>
      {children}
    </TeacherShell>
  );
}
