import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getMyClass, getScheduleSlots, formatHeure, jourIsoAujourdhui, JOURS_SEMAINE } from "@/lib/data/classes";

export default async function EmploiDuTempsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile?.school_id) redirect("/login");

  const myClass = await getMyClass(supabase);
  if (!myClass) redirect("/login");

  const slots = await getScheduleSlots(supabase, myClass.id);
  const jourAujourdhui = jourIsoAujourdhui();

  const parJour = new Map<number, typeof slots>();
  for (const slot of slots) {
    parJour.set(slot.jour, [...(parJour.get(slot.jour) ?? []), slot]);
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/teacher" className="text-[13px] text-ink-muted">
        ‹ Retour
      </Link>

      <div className="flex flex-col gap-0.5">
        <div className="font-serif text-2xl font-semibold text-ink">Emploi du temps</div>
        <div className="text-[13px] text-ink-muted">{myClass.name}</div>
      </div>

      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((jour) => {
          const creneaux = parJour.get(jour) ?? [];
          const estAujourdhui = jour === jourAujourdhui;
          return (
            <div
              key={jour}
              className={`flex items-center gap-3.5 rounded-xl border px-3.5 py-3 ${
                estAujourdhui ? "border-green bg-green-tint" : "border-border-soft bg-card"
              }`}
            >
              <div
                className={`w-[90px] shrink-0 text-sm font-semibold ${estAujourdhui ? "text-green" : "text-ink"}`}
              >
                {JOURS_SEMAINE[jour]}
              </div>
              {creneaux.length > 0 ? (
                <div className="flex flex-1 flex-wrap gap-2">
                  {creneaux.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-ink-soft"
                    >
                      {formatHeure(s.heure_debut)} – {formatHeure(s.heure_fin)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex-1 text-sm text-ink-faint">—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
