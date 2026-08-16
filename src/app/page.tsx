import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";

export default async function RootPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) redirect("/login");
  redirect(profile.role === "teacher" ? "/teacher" : "/federation");
}
