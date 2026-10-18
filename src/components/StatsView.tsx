import { BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDirections, getPriceHistory } from "../core/api";
import type { Direction, PriceHistory } from "../core/types";
import { currencySymbol, formatDate } from "../core/format";
import { useChat } from "../contexts/ChatContext";
import { useLocale } from "../contexts/LocaleContext";
import { Card } from "../ui/Card";
import { EmptyState, Page } from "../ui/Page";
import { Select } from "../ui/Select";
import { Spinner } from "../ui/Spinner";

const PALETTE = ["#8B7FF0", "#22B8CF", "#F783AC", "#69DB7C", "#FFA94D", "#A78BFA", "#4DABF7"];

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function StatsView({ initial }: { initial?: { src: string; dst: string } | null }) {
  const { t } = useLocale();
  const { info } = useChat();
  const currency = info?.currency ?? "EUR";

  const [directions, setDirections] = useState<Direction[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(false);
  // series keys hidden from the chart (toggled off in the legend)
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    getDirections()
      .then((dirs) => {
        setDirections(dirs);
        if (initial) setSelected(`${initial.src}-${initial.dst}`);
        else if (dirs.length) setSelected(`${dirs[0].src}-${dirs[0].dst}`);
      })
      .catch(() => setDirections([]));
  }, [initial]);

  useEffect(() => {
    if (!selected) return;
    const [src, dst] = selected.split("-");
    setLoading(true);
    setHistory(null);
    setHidden(new Set());
    getPriceHistory(src, dst, { currency })
      .then(setHistory)
      .catch(() => setHistory({}))
      .finally(() => setLoading(false));
  }, [selected, currency]);

  const { data, series } = useMemo(() => {
    if (!history) return { data: [], series: [] as { key: string; color: string; label: string }[] };
    const seriesKeys: { key: string; airline: string; travelDate: string }[] = [];
    const byDate = new Map<string, Record<string, number>>();

    for (const [airline, byTravelDate] of Object.entries(history)) {
      for (const [travelDate, points] of Object.entries(byTravelDate)) {
        const key = `${airline} · ${formatDate(travelDate)}`;
        seriesKeys.push({ key, airline, travelDate });
        for (const p of points) {
          const d = dayKey(p.dt);
          if (!byDate.has(d)) byDate.set(d, {});
          // coerce to a real number so recharts uses a numeric (not category) Y axis
          byDate.get(d)![key] = Number(p.price);
        }
      }
    }

    const multipleAirlines = Object.keys(history).length > 1;
    const rows = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, prices]) => ({ date, ...prices }));

    return {
      data: rows,
      series: seriesKeys.map(({ key, airline, travelDate }, i) => ({
        key,
        color: PALETTE[i % PALETTE.length],
        label: multipleAirlines ? `${formatDate(travelDate).slice(0, 5)} ${airline}` : formatDate(travelDate).slice(0, 5),
      })),
    };
  }, [history]);

  const visibleSeries = series.filter((s) => !hidden.has(s.key));

  const toggleSeries = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Solo: isolate this series (hide all others). Clicking an already-soloed item shows all.
  const soloSeries = (key: string) => {
    setHidden((prev) => {
      const allKeys = series.map((s) => s.key);
      const visible = allKeys.filter((k) => !prev.has(k));
      const isSolo = visible.length === 1 && visible[0] === key;
      return isSolo ? new Set() : new Set(allKeys.filter((k) => k !== key));
    });
  };

  const routeOptions = directions.map((d) => ({
    value: `${d.src}-${d.dst}`,
    label: `${d.src} → ${d.dst}`,
  }));

  return (
    <Page title={t.stats_title}>
      {directions.length === 0 ? (
        <EmptyState icon={<BarChart3 className="h-8 w-8" />} message={t.dir_empty} />
      ) : (
        <div className="flex flex-col gap-4">
          <Select
            value={selected}
            onChange={setSelected}
            options={routeOptions}
            placeholder={t.stats_select}
          />

          <Card className="p-3">
            {loading ? (
              <div className="flex h-72 items-center justify-center">
                <Spinner className="h-7 w-7" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-muted">
                {t.stats_noData}
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,140,160,0.18)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#9D97B5", fontSize: 11 }}
                      tickFormatter={(v: string) => formatDate(v).slice(0, 5)}
                      stroke="rgba(140,140,160,0.3)"
                    />
                    <YAxis
                      type="number"
                      domain={["dataMin - 5", "dataMax + 5"]}
                      allowDecimals={false}
                      tick={{ fill: "#9D97B5", fontSize: 11 }}
                      stroke="rgba(140,140,160,0.3)"
                      width={56}
                      tickFormatter={(v: number) => `${v}${currencySymbol(currency)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgb(var(--color-card))",
                        border: "1px solid rgb(var(--color-border))",
                        borderRadius: 12,
                        color: "rgb(var(--color-text))",
                        fontSize: 12,
                      }}
                      labelFormatter={(v: string) => `${t.stats_trackingDate}: ${formatDate(v)}`}
                      formatter={(value: number) => [`${value} ${currency}`, ""]}
                    />
                    {visibleSeries.map((s) => (
                      <Line
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        stroke={s.color}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {series.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {series.map((s) => {
                const isHidden = hidden.has(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleSeries(s.key)}
                    onDoubleClick={() => soloSeries(s.key)}
                    aria-pressed={!isHidden}
                    title={s.key}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs tabular-nums transition-colors ${
                      isHidden
                        ? "border-border text-muted/60"
                        : "border-border bg-card text-text hover:border-accent"
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: isHidden ? "rgb(var(--color-border))" : s.color }}
                    />
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
