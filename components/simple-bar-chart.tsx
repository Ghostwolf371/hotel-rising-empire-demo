export function SimpleBarChart({
  items,
  valueKey,
  labelKey,
  maxValue,
  formatValue,
}: {
  items: Record<string, string | number>[];
  valueKey: string;
  labelKey: string;
  maxValue?: number;
  formatValue?: (n: number) => string;
}) {
  const max =
    maxValue ??
    Math.max(...items.map((i) => Number(i[valueKey])), 1);
  const fmt = formatValue ?? ((n: number) => String(n));
  return (
    <div className="flex h-64 flex-col justify-end gap-3">
      <div className="flex flex-1 items-end gap-2 border-b border-[var(--border)] pb-1">
        {items.map((row, i) => {
          const v = Number(row[valueKey]);
          const pct = Math.round((v / max) * 100);
          return (
            <div
              key={i}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <div
                className="w-full max-w-[48px] rounded-t-md bg-[var(--navy)] transition-all"
                style={{ height: `${Math.max(pct, 4)}%` }}
                title={fmt(v)}
              />
              <span className="truncate text-center text-[10px] font-medium text-[var(--muted)]">
                {String(row[labelKey])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
