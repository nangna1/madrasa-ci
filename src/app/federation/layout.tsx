import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getFederation, getSchoolsForFederation, getAllSchools } from "@/lib/data/schools";
import FederationShell from "./federation-shell";

export default async function FederationLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "federation_admin" && profile.role !== "super_admin")) redirect("/login");
  if (profile.role === "federation_admin" && !profile.federation_id) redirect("/login");

  // super_admin : vue réseau, toutes fédérations confondues (pas de
  // federation_id qui le rattache à une seule d'entre elles).
  const isSuperAdmin = profile.role === "super_admin";
  const schools = isSuperAdmin
    ? await getAllSchools(supabase)
    : await getSchoolsForFederation(supabase, profile.federation_id!);

  let orgName = "Réseau Madrasa CI · toutes fédérations";
  if (!isSuperAdmin) {
    const federation = await getFederation(supabase, profile.federation_id!);
    if (!federation) redirect("/login");
    orgName = federation.name;
  }

  const integrationRate = schools.length
    ? Math.round((schools.filter((s) => s.status === "integree").length / schools.length) * 100)
    : 0;

  return (
    <FederationShell orgName={orgName} integrationRate={integrationRate}>
      {children}
    </FederationShell>
  );
}
