import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getFederation, getSchoolsForFederation } from "@/lib/data/schools";
import FederationShell from "./federation-shell";

export default async function FederationLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role !== "federation_admin" || !profile.federation_id) redirect("/login");

  const federation = await getFederation(supabase, profile.federation_id);
  if (!federation) redirect("/login");

  const schools = await getSchoolsForFederation(supabase, profile.federation_id);
  const integrationRate = schools.length
    ? Math.round((schools.filter((s) => s.status === "integree").length / schools.length) * 100)
    : 0;

  return (
    <FederationShell orgName={federation.name} integrationRate={integrationRate}>
      {children}
    </FederationShell>
  );
}
