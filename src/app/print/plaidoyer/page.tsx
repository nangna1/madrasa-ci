import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getFederation } from "@/lib/data/schools";
import { getAdvocacyData, getSchoolRows } from "@/lib/data/federation";
import PrintTrigger from "./print-trigger";

export default async function AdvocacyPrintPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "federation_admin" && profile.role !== "super_admin")) redirect("/login");
  if (profile.role === "federation_admin" && !profile.federation_id) redirect("/login");

  const federation = profile.federation_id ? await getFederation(supabase, profile.federation_id) : null;
  const [data, schools] = await Promise.all([getAdvocacyData(supabase), getSchoolRows(supabase)]);

  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-[800px] p-10 font-sans text-ink print:p-0">
      <PrintTrigger />
      <div className="mb-8 flex items-baseline justify-between border-b border-border pb-4">
        <div>
          <div className="font-serif text-2xl font-semibold">
            {federation?.name ?? "Réseau Madrasa CI · toutes fédérations"}
          </div>
          <div className="text-sm text-ink-muted">Dossier de plaidoyer · intégration au système national</div>
        </div>
        <div className="text-sm text-ink-muted">{today}</div>
      </div>

      <table className="mb-8 w-full border-collapse text-sm">
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.label} className="border-b border-[#EAE2CF]">
              <td className="py-2.5 text-ink-muted">{r.label}</td>
              <td className="py-2.5 text-right font-semibold">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-3 font-serif text-lg font-semibold">Écoles membres</div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="py-2 font-normal">École</th>
            <th className="py-2 font-normal">Région</th>
            <th className="py-2 font-normal">Élèves</th>
            <th className="py-2 font-normal">Statut</th>
            <th className="py-2 font-normal">Recouvrement</th>
          </tr>
        </thead>
        <tbody>
          {schools.map((s) => (
            <tr key={s.id} className="border-b border-[#EAE2CF]">
              <td className="py-2">{s.name}</td>
              <td className="py-2">{s.region}</td>
              <td className="py-2">{s.studentsCount}</td>
              <td className="py-2">{s.status}</td>
              <td className="py-2">{s.recoveryPct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
