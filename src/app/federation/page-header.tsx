export default function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-border bg-card px-[34px] pb-[18px] pt-6">
      <div className="flex flex-col gap-1">
        <div className="font-serif text-[27px] font-semibold tracking-tight text-ink">{title}</div>
        <div className="text-[13px] text-ink-muted">{subtitle}</div>
      </div>
    </div>
  );
}
