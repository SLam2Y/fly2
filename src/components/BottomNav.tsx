import { motion } from "framer-motion";
import { ArrowLeftRight, BarChart3, Plane, Settings, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale } from "../contexts/LocaleContext";

export type Tab = "directions" | "stats" | "promo" | "convert" | "settings";

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const { t } = useLocale();
  const items: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: "directions", label: t.nav_directions, icon: Plane },
    { key: "stats", label: t.nav_stats, icon: BarChart3 },
    { key: "promo", label: t.nav_promo, icon: Sparkles },
    { key: "convert", label: t.nav_convert, icon: ArrowLeftRight },
    { key: "settings", label: t.nav_settings, icon: Settings },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),var(--tg-safe-area-inset-bottom,0px))]">
        {items.map(({ key, label, icon: Icon }) => {
          const active = key === tab;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5"
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute -top-px h-0.5 w-8 rounded-full bg-accent"
                />
              )}
              <Icon
                className={`h-5 w-5 transition-colors ${active ? "text-accent" : "text-muted"}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
