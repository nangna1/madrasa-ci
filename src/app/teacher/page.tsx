import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getStudents, initials } from "@/lib/data/students";
import { getAttendanceForDate, todayISO } from "@/lib/data/attendance";
import { getPaymentsForPeriod, currentPeriod, formatFcfa, MONTHLY_FEE } from "@/lib/data/payments";
import { getProgressCounts, TOTAL_SOURATES } from "@/lib/data/memorization";
import { getMyClass, getScheduleSlots, formatHeure, jourIsoAujourdhui } from "@/lib/data/classes";

export default async function TeacherHomePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile?.school_id) redirect("/login");

  const myClass = await getMyClass(supabase);
  if (!myClass) redirect("/login");

  const [students, slots] = await Promise.all([
    getStudents(supabase, myClass.id),
    getScheduleSlots(supabase, myClass.id),
  ]);
  const studentIds = students.map((s) => s.id);
  const date = todayISO();
  const period = currentPeriod();

  const [attendance, payments, progressCounts] = await Promise.all([
    getAttendanceForDate(supabase, studentIds, date),
    getPaymentsForPeriod(supabase, studentIds, period),
    getProgressCounts(supabase, studentIds),
  ]);

  const total = students.length;
  const present = [...attendance.values()].filter((v) => v === true).length;
  const withoutStatus = students.filter((s) => attendance.get(s.id) === undefined).length;
  const paidCount = [...payments.values()].filter((p) => p.status === "paid").length;
  const pendingCount = [...payments.values()].filter((p) => p.status === "pending").length;
  // "Impayé" = ni payé, ni déjà en attente de confirmation mobile money —
  // une demande en cours n'a pas besoin d'être relancée.
  const unpaidCount = total - paidCount - pendingCount;
  const collected = paidCount * MONTHLY_FEE;
  const unpaid = unpaidCount * MONTHLY_FEE;

  const inProgress = students.filter((s) => {
    const count = progressCounts.get(s.id) ?? 0;
    return count > 0 && count < TOTAL_SOURATES;
  });

  const todos = [
    {
      title: `${unpaidCount} mensualité${unpaidCount > 1 ? "s" : ""} impayée${unpaidCount > 1 ? "s" : ""}`,
      sub: "Relancer par WhatsApp ou encaisser en mobile money",
      tone: "var(--color-terracotta)",
      href: "/teacher/payments",
      show: unpaidCount > 0,
    },
    {
      title: `${pendingCount} paiement${pendingCount > 1 ? "s" : ""} en attente de confirmation`,
      sub: "Demande envoyée au parent, à confirmer dès réception de l'argent",
      tone: "var(--color-gold)",
      href: "/teacher/payments",
      show: pendingCount > 0,
    },
    {
      title: "Appel du jour non terminé",
      sub: `${withoutStatus} élève(s) sans statut`,
      tone: "var(--color-gold)",
      href: "/teacher/attendance",
      show: withoutStatus > 0,
    },
    {
      title: `${inProgress.length} élève(s) en cours de mémorisation`,
      sub: inProgress.slice(0, 3).map((s) => s.full_name.split(" ")[0]).join(", ") || undefined,
      tone: "var(--color-green)",
      href: "/teacher/students",
      show: inProgress.length > 0,
    },
  ].filter((t) => t.show);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const jourAujourdhui = jourIsoAujourdhui();
  const creneauxAujourdhui = slots.filter((s) => s.jour === jourAujourdhui);

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-0.5">
        <div className="font-serif text-2xl font-semibold text-ink">Aujourd&apos;hui</div>
        <div className="text-[13px] text-ink-muted capitalize">{today}</div>
      </div>

      <Link
        href="/teacher/cours-en-direct"
        className="flex items-center justify-between gap-3 rounded-xl bg-green px-3.5 py-3.5 text-card-alt"
      >
        <div className="flex flex-col gap-0.5">
          <div className="text-xs uppercase tracking-[0.1em] text-white/70">{myClass.name}</div>
          <div className="text-sm font-semibold">▶ Cours en direct</div>
          <div className="text-xs text-white/70">Présence et mémorisation, élève par élève</div>
        </div>
        <span className="text-lg text-white/70">›</span>
      </Link>

      <Link
        href="/teacher/emploi-du-temps"
        className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-card px-3.5 py-3"
      >
        <div className="flex flex-col gap-0.5">
          <div className="text-xs uppercase tracking-[0.1em] text-ink-faint">{myClass.name}</div>
          {creneauxAujourdhui.length > 0 ? (
            <div className="text-sm font-semibold text-ink">
              {creneauxAujourdhui
                .map((s) => `${formatHeure(s.heure_debut)} – ${formatHeure(s.heure_fin)}`)
                .join(" · ")}
            </div>
          ) : (
            <div className="text-sm text-ink-muted">Pas de cours aujourd&apos;hui</div>
          )}
        </div>
        <span className="text-lg text-[#B7AE99]">›</span>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Élèves" value={String(total)} />
        <StatCard label="Présents" value={String(present)} tone="text-green" />
        <StatCard label="Encaissé ce mois" value={formatFcfa(collected)} small />
        <StatCard label="Impayés" value={formatFcfa(unpaid)} small tone="text-terracotta" />
      </div>

      {todos.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="text-xs uppercase tracking-[0.12em] text-ink-faint">À faire</div>
          {todos.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-card px-3.5 py-3.5 hover:border-[#C9BFA6]"
              style={{ borderLeft: `3px solid ${t.tone}` }}
            >
              <div className="flex flex-col gap-0.5">
                <div className="text-sm font-semibold text-ink">{t.title}</div>
                {t.sub && <div className="text-xs text-ink-muted">{t.sub}</div>}
              </div>
              <span className="text-lg text-[#B7AE99]">›</span>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="text-xs uppercase tracking-[0.12em] text-ink-faint">Progression de la classe</div>
        {students.slice(0, 4).map((s) => {
          const count = progressCounts.get(s.id) ?? 0;
          const pct = Math.round((count / TOTAL_SOURATES) * 100);
          return (
            <Link key={s.id} href={`/teacher/students/${s.id}`} className="flex items-center gap-3 py-1">
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#EDE5D4] font-serif text-[13px] font-semibold text-ink-muted">
                {initials(s.full_name)}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-ink">{s.full_name}</span>
                  <span className="text-xs text-ink-muted">
                    {count}/{TOTAL_SOURATES} sourates
                  </span>
                </div>
                <div className="h-[5px] overflow-hidden rounded-full bg-[#E8E0CD]">
                  <div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: string;
  tone?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-[14px] border border-border-soft bg-card p-3.5">
      <div className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">{label}</div>
      <div className={`mt-1 font-serif font-semibold ${small ? "text-[22px]" : "text-[30px]"} ${tone ?? "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
