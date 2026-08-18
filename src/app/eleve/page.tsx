import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getStudent } from "@/lib/data/students";
import { getSourates, getProgressForStudent, TOTAL_SOURATES } from "@/lib/data/memorization";
import { getMonthAttendanceSummary } from "@/lib/data/attendance";
import { getPaymentsForPeriod, currentPeriod, formatFcfa } from "@/lib/data/payments";
import { getLiveReading } from "@/lib/data/liveReading";
import LiveReadingView from "./live-reading-view";

const BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  ok: { label: "Mémorisé", bg: "var(--color-green-tint)", fg: "var(--color-green)" },
  wip: { label: "En cours", bg: "#FBEFD6", fg: "#8A6218" },
  todo: { label: "À venir", bg: "var(--color-paper-sunk)", fg: "var(--color-ink-faint)" },
};

export default async function EleveHomePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile?.student_id) redirect("/login");

  const student = await getStudent(supabase, profile.student_id);
  if (!student) redirect("/login");

  const period = currentPeriod();
  const [sourates, progress, attendanceSummary, payments, classRow, liveReading] = await Promise.all([
    getSourates(supabase),
    getProgressForStudent(supabase, profile.student_id),
    getMonthAttendanceSummary(supabase, profile.student_id),
    getPaymentsForPeriod(supabase, [profile.student_id], period),
    student.class_id
      ? supabase.from("classes").select("name").eq("id", student.class_id).maybeSingle()
      : Promise.resolve({ data: null }),
    student.class_id ? getLiveReading(supabase, student.class_id) : Promise.resolve(null),
  ]);

  const memoCount = [...progress.values()].filter((s) => s === "ok").length;
  const progressPct = Math.round((memoCount / TOTAL_SOURATES) * 100);
  const payment = payments.get(profile.student_id);
  const paid = payment?.status === "paid";
  const pending = payment?.status === "pending";

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-0.5">
        <div className="font-serif text-2xl font-semibold text-ink">{student.full_name}</div>
        {student.name_ar && (
          <div dir="rtl" className="font-arabic text-base text-ink-faint">
            {student.name_ar}
          </div>
        )}
        <div className="text-[13px] text-ink-muted">{classRow?.data?.name ?? "Classe non assignée"}</div>
      </div>

      {student.class_id && <LiveReadingView classId={student.class_id} initialReading={liveReading} />}

      <div className="flex flex-col gap-2.5 rounded-[14px] bg-green p-4 text-card-alt">
        <div className="text-xs uppercase tracking-[0.1em] text-white/70">Mémorisation du Coran</div>
        <div className="font-serif text-[30px] font-semibold">
          {memoCount}/{TOTAL_SOURATES}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
          <div className="h-full bg-gold" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[14px] border border-border-soft bg-card p-3.5">
          <div className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">Présence ce mois</div>
          <div className="mt-1 font-serif text-[22px] font-semibold text-ink">
            {attendanceSummary.present}/{attendanceSummary.recorded || "—"}
          </div>
        </div>
        <div className="rounded-[14px] border border-border-soft bg-card p-3.5">
          <div className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">Mensualité {period}</div>
          <div
            className={`mt-1 font-serif text-[18px] font-semibold ${
              paid ? "text-green" : pending ? "text-gold" : "text-terracotta"
            }`}
          >
            {paid ? "Payée" : pending ? "En attente" : "Non payée"}
          </div>
          {payment && <div className="text-[11px] text-ink-faint">{formatFcfa(payment.amount)}</div>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-[0.12em] text-ink-faint">Sourates</div>
        {sourates.map((s) => {
          const status = progress.get(s.id) ?? "todo";
          const badge = BADGE[status];
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-[11px] border border-border-soft px-3 py-2.5"
              style={{ background: status === "wip" ? "#FFFDF3" : "white" }}
            >
              <span className="w-[22px] text-xs text-[#A79E88]">{s.num}</span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm text-ink">{s.name}</span>
                <span dir="rtl" className="font-arabic text-sm text-ink-faint">
                  {s.name_ar}
                </span>
              </div>
              <span
                className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold"
                style={{ background: badge.bg, color: badge.fg }}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
