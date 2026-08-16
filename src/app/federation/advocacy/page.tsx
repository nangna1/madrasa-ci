import { createClient } from "@/lib/supabase/server";
import { getAdvocacyData } from "@/lib/data/federation";
import PageHeader from "../page-header";
import PrintButton from "./print-button";

export default async function AdvocacyPage() {
  const supabase = await createClient();
  const data = await getAdvocacyData(supabase);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Plaidoyer"
        subtitle="Indicateurs consolidés à l'appui de la demande d'intégration au système national"
      />
      <div className="grid grid-cols-[1.2fr_1fr] items-start gap-[18px] px-[34px] py-[26px]">
        <div className="flex flex-col gap-[18px] rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col gap-1.5">
            <div className="font-serif text-xl font-semibold text-ink">
              Dossier de plaidoyer · intégration au système national
            </div>
            <div className="text-[13px] leading-relaxed text-ink-muted">
              Données consolidées sur les écoles membres, prêtes à être transmises au Ministère de
              l&apos;Éducation Nationale.
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {data.rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-4 border-b border-[#EAE2CF] pb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] font-semibold text-ink">{r.label}</span>
                  <span className="text-xs text-ink-faint">{r.source}</span>
                </div>
                <span className="whitespace-nowrap font-serif text-xl font-semibold text-ink">{r.value}</span>
              </div>
            ))}
          </div>
          <PrintButton />
        </div>

        <div className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-6">
            <div className="font-serif text-lg font-semibold text-ink">Couverture du réseau</div>
            {data.coverage.map((c) => (
              <div key={c.label} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-ink">{c.label}</span>
                  <span className="text-[12.5px] text-ink-muted">{c.pct}%</span>
                </div>
                <div className="h-[7px] overflow-hidden rounded-full bg-[#E8E0CD]">
                  <div className="h-full bg-green" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
