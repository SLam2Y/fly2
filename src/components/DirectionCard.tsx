import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpDown, BarChart3, Coins, Pencil, Plane, Trash2 } from "lucide-react";
import type { Airport, Direction } from "../core/types";
import { countryFlag, formatDate, formatMoney } from "../core/format";
import { useLocale } from "../contexts/LocaleContext";

function NotifyIcon({ value }: { value: boolean | null }) {
  if (value === null) return <ArrowUpDown className="h-3.5 w-3.5" />;
  return value ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />;
}

export function DirectionCard({
  direction,
  currency,
  airports,
  onEdit,
  onDelete,
  onStats,
}: {
  direction: Direction;
  currency: string;
  airports: Airport[];
  onEdit: () => void;
  onDelete: () => void;
  onStats: () => void;
}) {
  const { t } = useLocale();
  const src = airports.find((a) => a.code === direction.src);
  const dst = airports.find((a) => a.code === direction.dst);

  const notifyLabel =
    direction.notify_on_decrease === null
      ? t.dir_notify_any
      : direction.notify_on_decrease
        ? t.dir_notify_decrease
        : t.dir_notify_increase;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="overflow-hidden rounded-xl2 border border-border bg-card/80 backdrop-blur-sm"
    >
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <Endpoint code={direction.src} airport={src} />
          <div className="flex flex-1 items-center gap-1.5 text-accent" aria-hidden>
            <span className="h-px flex-1 border-t border-dashed border-accent/40" />
            <Plane className="h-4 w-4 rotate-45" />
            <span className="h-px flex-1 border-t border-dashed border-accent/40" />
          </div>
          <Endpoint code={direction.dst} airport={dst} alignEnd />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
          <span>✈️ {formatDate(direction.travel_date)}</span>
          <span className="inline-flex items-center gap-1">
            <NotifyIcon value={direction.notify_on_decrease} /> {notifyLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" /> {t.dir_threshold}: {formatMoney(direction.threshold, currency)}
          </span>
        </div>
      </div>

      <div className="relative h-0 border-t border-dashed border-border">
        <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border border-border bg-bg" />
        <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full border border-border bg-bg" />
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0">
          <div className="text-[11px] text-muted">{t.dir_priceLimit}</div>
          <div className="text-lg font-semibold tabular-nums text-accent">
            ≤ {formatMoney(direction.price, currency)}
          </div>
        </div>
        <div className="flex gap-1">
          <CardAction icon={<BarChart3 className="h-4 w-4" />} label={t.dir_viewStats} onClick={onStats} />
          <CardAction icon={<Pencil className="h-4 w-4" />} label={t.edit} onClick={onEdit} />
          <CardAction icon={<Trash2 className="h-4 w-4" />} label={t.remove} onClick={onDelete} danger />
        </div>
      </div>
    </motion.div>
  );
}

function Endpoint({ code, airport, alignEnd }: { code: string; airport?: Airport; alignEnd?: boolean }) {
  return (
    <div className={`min-w-0 ${alignEnd ? "text-right" : ""}`}>
      <div className="text-3xl font-bold tracking-tight text-text">{code}</div>
      <div className="truncate text-xs text-muted">
        {countryFlag(airport?.country ?? "")} {airport?.name ?? ""}
      </div>
    </div>
  );
}

function CardAction({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
        danger ? "text-danger hover:bg-danger/10" : "text-muted hover:bg-accent-soft hover:text-text"
      }`}
    >
      {icon}
    </button>
  );
}
