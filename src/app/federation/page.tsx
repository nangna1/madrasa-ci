import { createClient } from "@/lib/supabase/server";
import { getOverview } from "@/lib/data/federation";
import { getT } from "@/lib/i18n/server";
import PageHeader from "./page-header";

export default async function FederationOverviewPage() {
  const supabase = await createClient();
  const { t } = await getT();
  const overview = await getOverview(supabase, t);

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t("Vue d'ensemble du réseau")}
        subtitle={t("{schools} écoles équipées · {students} élèves suivis", {
          schools: overview.kpis.schoolsCount,
          students: overview.kpis.totalStudents,
        })}
      />

      <div className="flex flex-col gap-6 px-[34px] py-[26px]">
        <div className="grid grid-cols-4 gap-3.5">
          <Kpi label={t("Écoles équipées")} value={String(overview.kpis.schoolsCount)} />
          <Kpi label={t("Élèves suivis")} value={String(overview.kpis.totalStudents)} />
          <Kpi label={t("Recouvrement moyen")} value={`${overview.kpis.recoveryPct}%`} />
          <Kpi label={t("Écoles intégrées")} value={String(overview.kpis.integratedCount)} tone="text-terracotta" />
        </div>

        <div className="grid grid-cols-[1.45fr_1fr] items-start gap-[18px]">
          <div className="flex flex-col gap-[18px] rounded-2xl border border-border bg-card p-[22px]">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <div className="font-serif text-lg font-semibold text-ink">{t("Écoles équipées par région")}</div>
                <div className="text-[12.5px] text-ink-muted">{t("Nombre d'écoles membres par région")}</div>
              </div>
            </div>
            <div className="flex flex-col gap-[15px]">
              {overview.regions.map((r) => (
                <div key={r.name} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] text-ink">{r.name}</span>
                    <span className="text-[12.5px] text-ink-muted">{t("{n} école(s)", { n: r.count })}</span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-[#E8E0CD]">
                    <div className="h-full bg-green" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
              {overview.regions.length === 0 && (
                <div className="text-sm text-ink-faint">{t("Aucune école enregistrée pour l'instant.")}</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-3.5 rounded-2xl bg-green-deep p-[22px] text-[#E7DFCB]">
              <div className="font-serif text-lg font-semibold text-[#FBF7EE]">{t("Recouvrement des mensualités")}</div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-serif text-[34px] font-semibold text-[#FBF7EE]">
                  {overview.recoveryPct}%
                </span>
              </div>
              <div className="text-[12.5px] text-[#90AC9D]">{overview.recoveryDetail}</div>
              <div className="h-2 overflow-hidden rounded-full bg-black/25">
                <div className="h-full bg-gold" style={{ width: `${overview.recoveryPct}%` }} />
              </div>
              {overview.operatorSplit.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-white/[0.16] pt-3.5">
                  {overview.operatorSplit.map((o) => (
                    <div key={o.name} className="flex items-center gap-2.5 text-[12.5px]">
                      <span className="flex-1">{o.name}</span>
                      <span className="text-[#90AC9D]">{o.share}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-[22px]">
              <div className="font-serif text-lg font-semibold text-ink">{t("Signaux à traiter")}</div>
              {overview.alerts.length === 0 && (
                <div className="text-sm text-ink-faint">{t("Aucun signal pour l'instant.")}</div>
              )}
              {overview.alerts.map((a) => (
                <div key={a.title} className="flex gap-2.5 border-t border-[#EAE2CF] py-2.5 first:border-t-0 first:pt-0">
                  <span className="mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-terracotta" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-ink">{a.title}</span>
                    <span className="text-[12.5px] leading-relaxed text-ink-muted">{a.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-[22px]">
          <div className="flex items-baseline justify-between gap-4">
            <div className="font-serif text-lg font-semibold text-ink">{t("Progression de la mémorisation · réseau")}</div>
            <div className="text-[12.5px] text-ink-muted">{t("Part des élèves par palier de sourates mémorisées")}</div>
          </div>
          <div className="flex h-[168px] items-end gap-3.5">
            {overview.hifzBars.map((b) => (
              <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold text-ink-soft">{b.value}</span>
                <div className="w-full rounded-t-lg bg-green" style={{ height: b.height }} />
                <span className="text-center text-[11.5px] text-ink-muted">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-border bg-card px-[18px] py-[17px]">
      <div className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">{label}</div>
      <div className={`font-serif text-[30px] font-semibold ${tone ?? "text-ink"}`}>{value}</div>
    </div>
  );
}
