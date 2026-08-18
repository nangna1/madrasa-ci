import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";

export default async function RootPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) redirect("/login");
  if (profile.role === "teacher") redirect("/teacher");
  if (profile.role === "student") redirect("/eleve");
  redirect("/federation");
}
