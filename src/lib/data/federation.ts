import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { currentPeriod, MONTHLY_FEE } from "@/lib/data/payments";
import { TOTAL_SOURATES } from "@/lib/data/memorization";

// Toutes les requêtes ci-dessous s'appuient sur les policies RLS
// `*_federation_read` (voir supabase/migrations/0001_init.sql) : un admin
// fédération ne reçoit déjà que les lignes des écoles de sa fédération,
// sans avoir besoin de filtrer explicitement par school_id ici.

export interface SchoolAggregate {
  id: string;
  name: string;
  nameAr: string | null;
  region: string;
  status: string;
  contactName: string | null;
  contactPhone: string | null;
  studentsCount: number;
  recoveryPct: number;
  lastActivity: string | null;
}

async function loadScope(supabase: SupabaseClient<Database>) {
  const period = currentPeriod();

  const [{ data: schools, error: schoolsErr }, { data: students, error: studentsErr }] =
    await Promise.all([
      supabase.from("schools").select("*").order("name"),
      supabase.from("students").select("id, school_id"),
    ]);
  if (schoolsErr) throw schoolsErr;
  if (studentsErr) throw studentsErr;

  const studentIds = (students ?? []).map((s) => s.id);

  const [{ data: payments, error: paymentsErr }, { data: progress, error: progressErr }] =
    await Promise.all([
      studentIds.length
        ? supabase.from("payments").select("student_id, status, method, amount, paid_at").eq("period", period)
        : Promise.resolve({ data: [], error: null }),
      studentIds.length
        ? supabase.from("memorization_progress").select("student_id, status")
        : Promise.resolve({ data: [], error: null }),
    ]);
  if (paymentsErr) throw paymentsErr;
  if (progressErr) throw progressErr;

  return {
    schools: schools ?? [],
    students: students ?? [],
    payments: payments ?? [],
    progress: progress ?? [],
    period,
  };
}

export async function getSchoolRows(
  supabase: SupabaseClient<Database>,
): Promise<SchoolAggregate[]> {
  const { schools, students, payments } = await loadScope(supabase);

  const studentsBySchool = new Map<string, string[]>();
  for (const s of students) {
    const list = studentsBySchool.get(s.school_id) ?? [];
    list.push(s.id);
    studentsBySchool.set(s.school_id, list);
  }

  const paymentByStudent = new Map(payments.map((p) => [p.student_id, p]));

  return schools.map((school) => {
    const ids = studentsBySchool.get(school.id) ?? [];
    const paid = ids.filter((id) => paymentByStudent.get(id)?.status === "paid");
    const lastActivity = ids
      .map((id) => paymentByStudent.get(id)?.paid_at)
      .filter((v): v is string => Boolean(v))
      .sort()
      .at(-1);

    return {
      id: school.id,
      name: school.name,
      nameAr: school.name_ar,
      region: school.region,
      status: school.status,
      contactName: school.contact_name,
      contactPhone: school.contact_phone,
      studentsCount: ids.length,
      recoveryPct: ids.length ? Math.round((paid.length / ids.length) * 100) : 0,
      lastActivity: lastActivity ?? null,
    };
  });
}

export async function getOverview(supabase: SupabaseClient<Database>) {
  const { schools, students, payments, progress } = await loadScope(supabase);

  const totalStudents = students.length;
  const paidCount = payments.filter((p) => p.status === "paid").length;
  const recoveryPct = students.length ? Math.round((paidCount / students.length) * 100) : 0;

  const regionCounts = new Map<string, number>();
  for (const s of schools) regionCounts.set(s.region, (regionCounts.get(s.region) ?? 0) + 1);
  const maxRegionCount = Math.max(1, ...regionCounts.values());
  const regions = [...regionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, pct: Math.round((count / maxRegionCount) * 100) }));

  const operatorCounts = new Map<string, number>();
  for (const p of payments) {
    if (p.status === "paid" && p.method) operatorCounts.set(p.method, (operatorCounts.get(p.method) ?? 0) + 1);
  }
  const operatorSplit = [...operatorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      share: paidCount ? Math.round((count / paidCount) * 100) : 0,
    }));

  const buckets = [
    { label: "0 sourate", min: 0, max: 0 },
    { label: "1-9 sourates", min: 1, max: 9 },
    { label: "10-29 sourates", min: 10, max: 29 },
    { label: "30-59 sourates", min: 30, max: 59 },
    { label: "60-89 sourates", min: 60, max: 89 },
    { label: `90-${TOTAL_SOURATES} sourates`, min: 90, max: TOTAL_SOURATES },
  ];
  const okCountByStudent = new Map<string, number>();
  for (const row of progress) {
    if (row.status !== "ok") continue;
    okCountByStudent.set(row.student_id, (okCountByStudent.get(row.student_id) ?? 0) + 1);
  }
  const counts = students.map((s) => okCountByStudent.get(s.id) ?? 0);
  const hifzBars = buckets.map((b) => {
    const n = counts.filter((c) => c >= b.min && c <= b.max).length;
    const pct = totalStudents ? Math.round((n / totalStudents) * 100) : 0;
    return { label: b.label, value: `${pct}%`, height: `${Math.max(pct, 3)}%`, count: n };
  });

  const lowRecoverySchools = (await getSchoolRows(supabase))
    .filter((s) => s.studentsCount > 0 && s.recoveryPct < 60)
    .sort((a, b) => a.recoveryPct - b.recoveryPct)
    .slice(0, 3);

  const integratedReady = schools.filter((s) => s.status === "integree").length;

  return {
    kpis: {
      schoolsCount: schools.length,
      totalStudents,
      recoveryPct,
      integratedCount: integratedReady,
    },
    regions,
    recoveryPct,
    recoveryDetail: `des mensualités attendues (${paidCount}/${students.length || 0}), encaissées en mobile money`,
    operatorSplit,
    hifzBars,
    alerts: lowRecoverySchools.map((s) => ({
      title: `${s.name} (${s.region}) · recouvrement à ${s.recoveryPct}%`,
      sub: "Relance groupée des parents possible depuis l'école.",
    })),
  };
}

export async function getAdvocacyData(supabase: SupabaseClient<Database>) {
  const { schools, students, payments, progress } = await loadScope(supabase);

  const studentsWithProgress = new Set(progress.map((p) => p.student_id)).size;
  const paidTotal = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const schoolsWithStudents = new Set(students.map((s) => s.school_id)).size;
  const schoolsWithProgress = new Set(
    students.filter((s) => progress.some((p) => p.student_id === s.id)).map((s) => s.school_id),
  ).size;
  const schoolsWithPayments = new Set(
    students.filter((s) => payments.some((p) => p.student_id === s.id)).map((s) => s.school_id),
  ).size;

  const { data: teacherProfiles } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "teacher");

  return {
    rows: [
      { label: "Écoles membres", value: String(schools.length), source: "Écoles enregistrées Madrasa CI" },
      { label: "Élèves suivis", value: String(students.length), source: "Effectifs synchronisés" },
      {
        label: "Élèves avec dossier de mémorisation",
        value: String(studentsWithProgress),
        source: "Suivi pédagogique actif",
      },
      { label: "Enseignants recensés", value: String(teacherProfiles?.length ?? 0), source: "Comptes enseignants" },
      { label: "Mensualités traçables", value: `${paidTotal.toLocaleString("fr-FR")} FCFA`, source: "Mobile money, période en cours" },
    ],
    coverage: [
      {
        label: "Écoles avec effectifs à jour",
        pct: schools.length ? Math.round((schoolsWithStudents / schools.length) * 100) : 0,
      },
      {
        label: "Écoles avec suivi mémorisation actif",
        pct: schools.length ? Math.round((schoolsWithProgress / schools.length) * 100) : 0,
      },
      {
        label: "Écoles avec paiements traçables",
        pct: schools.length ? Math.round((schoolsWithPayments / schools.length) * 100) : 0,
      },
    ],
    monthlyFee: MONTHLY_FEE,
  };
}
