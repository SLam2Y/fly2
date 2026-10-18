import { Moon, Sun } from "lucide-react";
import { useLocale } from "../contexts/LocaleContext";
import { useTheme } from "../contexts/ThemeContext";

export function TopBar() {
  const { t, locale, setLocale } = useLocale();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 pt-[calc(var(--tg-safe-area-inset-top,0px)+var(--tg-content-safe-area-inset-top,0px))] backdrop-blur-lg">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-white">
            <span className="text-sm font-bold">f2</span>
          </div>
          <span className="font-semibold text-text">{t.appName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLocale(locale === "en" ? "ru" : "en")}
            className="rounded-xl border border-border bg-card/60 px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
          >
            {locale.toUpperCase()}
          </button>
          <button
            onClick={toggle}
            aria-label={t.set_theme}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card/60 text-muted transition-colors hover:text-accent"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
