import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getMyClass, getScheduleSlots } from "@/lib/data/classes";
import { getSubjectsCatalog, getClassSubjects } from "@/lib/data/subjects";
import EmploiDuTempsView from "./emploi-du-temps-view";

export default async function EmploiDuTempsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile?.school_id) redirect("/login");

  const myClass = await getMyClass(supabase);
  if (!myClass) redirect("/login");

  const [slots, catalog, classSubjects] = await Promise.all([
    getScheduleSlots(supabase, myClass.id),
    getSubjectsCatalog(supabase),
    getClassSubjects(supabase, myClass.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/teacher" className="text-[13px] text-ink-muted">
        ‹ Retour
      </Link>

      <div className="flex flex-col gap-0.5">
        <div className="font-serif text-2xl font-semibold text-ink">Emploi du temps</div>
        <div className="text-[13px] text-ink-muted">{myClass.name}</div>
      </div>

      <EmploiDuTempsView
        classId={myClass.id}
        className={myClass.name}
        initialSlots={slots}
        catalog={catalog}
        initialClassSubjects={classSubjects}
      />
    </div>
  );
}
