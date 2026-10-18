import { ChevronRight, Globe, LogOut, Moon, Plane, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrencies, setCurrency as apiSetCurrency, toggleSilent } from "../core/api";
import { formatDateTime } from "../core/format";
import type { CurrencyInfo } from "../core/types";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import { useLocale } from "../contexts/LocaleContext";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import type { LocaleCode } from "../core/i18n/translations";
import { Card, SectionTitle } from "../ui/Card";
import { Page } from "../ui/Page";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import { ScheduleEditor } from "./ScheduleEditor";

export function SettingsView({ onOpenAirports }: { onOpenAirports: () => void }) {
  const { t, locale, setLocale } = useLocale();
  const { theme, setTheme, accent, setAccent } = useTheme();
  const { toast } = useToast();
  const { logout } = useAuth();
  const { info, patch } = useChat();

  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCurrencies().then(setCurrencies).catch(() => setCurrencies([]));
  }, []);

  const currencyLocked = (info?.directions_count ?? 0) > 0;

  const onSilent = async () => {
    setBusy(true);
    try {
      const res = await toggleSilent();
      patch({ less: res.less });
    } catch (e) {
      toast(e instanceof Error ? e.message : t.errGeneric, "error");
    } finally {
      setBusy(false);
    }
  };

  const onCurrency = async (code: string) => {
    try {
      await apiSetCurrency(code);
      patch({ currency: code });
      toast(t.save, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t.errGeneric, "error");
    }
  };

  return (
    <Page title={t.set_title}>
      <div className="flex flex-col gap-6">
        {/* Schedule */}
        <section className="flex flex-col gap-2">
          <SectionTitle>{t.set_schedule}</SectionTitle>
          <Card>
            <p className="mb-3 text-xs text-muted">{t.set_scheduleDesc}</p>
            <ScheduleEditor />
          </Card>
        </section>

        {/* Notifications */}
        <section className="flex flex-col gap-2">
          <SectionTitle>{t.set_silent}</SectionTitle>
          <Card className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted">{t.set_silentDesc}</p>
            <Toggle checked={info?.less ?? false} onChange={onSilent} disabled={busy} />
          </Card>
        </section>

        {/* Currency */}
        <section className="flex flex-col gap-2">
          <SectionTitle>{t.set_currency}</SectionTitle>
          <Card className="flex flex-col gap-2">
            <Select
              value={info?.currency ?? "EUR"}
              onChange={onCurrency}
              disabled={currencyLocked}
              options={currencies.map((c) => ({
                value: c.code,
                label: c.symbol ? `${c.code} (${c.symbol})` : c.code,
              }))}
            />
            {currencyLocked && <p className="px-1 text-xs text-muted">{t.set_currencyLocked}</p>}
          </Card>
        </section>

        {/* Appearance */}
        <section className="flex flex-col gap-2">
          <SectionTitle>{t.set_appearance}</SectionTitle>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">{t.set_theme}</span>
              <SegmentedControl<"light" | "dark">
                value={theme}
                onChange={setTheme}
                segments={[
                  { value: "light", label: t.set_themeLight },
                  { value: "dark", label: t.set_themeDark },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">{t.set_accent}</span>
              <SegmentedControl<"lavender" | "blue">
                value={accent}
                onChange={setAccent}
                segments={[
                  { value: "lavender", label: t.set_accentLavender },
                  { value: "blue", label: t.set_accentBlue },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">{t.set_language}</span>
              <SegmentedControl<LocaleCode>
                value={locale}
                onChange={setLocale}
                segments={[
                  { value: "en", label: "English" },
                  { value: "ru", label: "Русский" },
                ]}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted">
              {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              <Globe className="h-3.5 w-3.5" />
            </div>
          </Card>
        </section>

        {/* Airports link */}
        <section className="flex flex-col gap-2">
          <Card onClick={onOpenAirports} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-text">{t.set_airports}</p>
                <p className="text-xs text-muted">{t.set_airportsDesc}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Card>
        </section>

        {/* Account */}
        <section className="flex flex-col gap-2">
          <SectionTitle>{t.set_account}</SectionTitle>
          <Card className="flex flex-col gap-2 text-sm">
            <Row label={t.set_chatId} value={info?.chat_id ?? "—"} />
            <Row label={t.set_routes} value={String(info?.directions_count ?? 0)} />
            <Row label={t.set_premium} value={info?.premium ? t.on : t.off} />
            <Row
              label={t.set_lastNotified}
              value={info?.last_notified ? formatDateTime(info.last_notified)! : t.set_never}
            />
          </Card>
        </section>

        <button
          onClick={logout}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl2 border border-border bg-card/60 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" /> {t.set_logout}
        </button>
      </div>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}
