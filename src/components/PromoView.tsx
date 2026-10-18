import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { getFlightLink, promo } from "../core/api";
import type { PromoFare } from "../core/types";
import { countryFlag, formatDate, formatMoney } from "../core/format";
import { openExternal } from "../core/telegram";
import { useLocale } from "../contexts/LocaleContext";
import { useToast } from "../contexts/ToastContext";
import { useAirports } from "../hooks/useAirports";
import { AirportPicker } from "../ui/AirportPicker";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { EmptyState, Page } from "../ui/Page";
import { Spinner } from "../ui/Spinner";

export function PromoView() {
  const { t } = useLocale();
  const { toast } = useToast();
  const { airports } = useAirports();

  const [src, setSrc] = useState("");
  const [dst, setDst] = useState("");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PromoFare[] | null>(null);
  const [linkingKey, setLinkingKey] = useState<string | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    try {
      setResults(await promo(src, date, Number(price)));
    } catch (err) {
      toast(err instanceof Error ? err.message : t.errGeneric, "error");
    } finally {
      setLoading(false);
    }
  };

  const shown = results && dst ? results.filter((f) => f.dst === dst) : results;

  const openFare = async (f: PromoFare, key: string) => {
    if (linkingKey) return;
    setLinkingKey(key);
    try {
      const { links } = await getFlightLink(f.src, f.dst, f.travel_date);
      // prefer the fare's own airline; fall back to any available booking link
      const match = links.find((l) => l.airline === f.airline) ?? links[0];
      if (match) openExternal(match.url);
      else toast(t.promo_noLink, "error");
    } catch (err) {
      toast(err instanceof Error ? err.message : t.errGeneric, "error");
    } finally {
      setLinkingKey(null);
    }
  };

  return (
    <Page title={t.promo_title} subtitle={t.promo_desc}>
      <form onSubmit={search} className="flex flex-col gap-4">
        <Field label={t.promo_from}>
          <AirportPicker value={src} onChange={setSrc} airports={airports} placeholder={t.promo_from} />
        </Field>
        <Field label={t.promo_to}>
          <div className="relative">
            <AirportPicker value={dst} onChange={setDst} airports={airports} placeholder={t.promo_toAny} />
            {dst && (
              <button
                type="button"
                onClick={() => setDst("")}
                aria-label={t.promo_toClear}
                className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-lg bg-surface text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.promo_date}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label={t.promo_maxPrice}>
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              placeholder="150"
              required
            />
          </Field>
        </div>
        <Button type="submit" full loading={loading} disabled={!src || !date || !price}>
          <Sparkles className="h-4 w-4" /> {t.promo_search}
        </Button>
      </form>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10 text-muted">
            <Spinner className="h-7 w-7" />
            <p className="text-sm">{t.promo_searching}</p>
          </div>
        ) : shown === null ? null : shown.length === 0 ? (
          <EmptyState message={t.promo_noResults} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">
              {t.promo_results(shown.length)}
            </p>
            <p className="px-1 -mt-1 text-xs text-muted">{t.promo_openHint}</p>
            {shown.map((f, i) => {
              const key = `${f.dst}-${f.airline}-${i}`;
              const linking = linkingKey === key;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card
                    onClick={() => openFare(f, key)}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex items-center gap-2 font-semibold text-text">
                      <span>{f.src}</span>
                      <ArrowRight className="h-4 w-4 text-accent" />
                      <span>{countryFlag(airports.find((a) => a.code === f.dst)?.country ?? "")}</span>
                      <span>{f.dst}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-accent">
                          {formatMoney(f.price, f.currency)}
                        </span>
                        <span className="text-xs text-muted">
                          {f.airline} · {formatDate(f.travel_date)}
                        </span>
                      </div>
                      {linking ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted" />
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}
