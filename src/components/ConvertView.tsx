import { motion } from "framer-motion";
import { ArrowLeftRight } from "lucide-react";
import { useEffect, useState } from "react";
import { convert, getCurrencies } from "../core/api";
import type { CurrencyInfo } from "../core/types";
import { useChat } from "../contexts/ChatContext";
import { useLocale } from "../contexts/LocaleContext";
import { useToast } from "../contexts/ToastContext";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Page } from "../ui/Page";
import { Select } from "../ui/Select";

export function ConvertView() {
  const { t } = useLocale();
  const { toast } = useToast();
  const { info } = useChat();

  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState(info?.currency ?? "USD");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrencies().then(setCurrencies).catch(() => setCurrencies([]));
  }, []);

  const options = currencies.map((c) => ({
    value: c.code,
    label: c.symbol ? `${c.code} (${c.symbol})` : c.code,
  }));

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await convert(Number(amount), from, to);
      setResult(res.result);
    } catch (err) {
      toast(err instanceof Error ? err.message : t.errGeneric, "error");
    } finally {
      setLoading(false);
    }
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    setResult(null);
  };

  return (
    <Page title={t.convert_title}>
      <form onSubmit={run} className="flex flex-col gap-4">
        <Field label={t.convert_amount}>
          <Input
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setResult(null);
            }}
            inputMode="numeric"
            required
          />
        </Field>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
          <Field label={t.convert_from}>
            <Select
              value={from}
              onChange={(v) => {
                setFrom(v);
                setResult(null);
              }}
              options={options}
            />
          </Field>
          <button
            type="button"
            onClick={swap}
            aria-label={t.convert_swap}
            className="mb-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl2 border border-border bg-surface text-accent transition-colors hover:bg-accent-soft"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <Field label={t.convert_to}>
            <Select
              value={to}
              onChange={(v) => {
                setTo(v);
                setResult(null);
              }}
              options={options}
            />
          </Field>
        </div>

        <Button type="submit" full loading={loading}>
          {t.convert_go}
        </Button>
      </form>

      {result !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <Card className="text-center">
            <p className="text-sm text-muted">
              {amount} {from} =
            </p>
            <p className="mt-1 text-3xl font-bold text-accent">
              {result} {to}
            </p>
          </Card>
        </motion.div>
      )}
    </Page>
  );
}
