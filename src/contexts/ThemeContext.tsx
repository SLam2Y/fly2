import { createContext, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../core/config";
import { storage } from "../core/storage";
import { getTelegramColorScheme, setTelegramColors } from "../core/telegram";

type Theme = "light" | "dark";
type Accent = "lavender" | "blue";

function getInitialTheme(): Theme {
  const stored = storage.get(STORAGE_KEYS.theme);
  if (stored === "light" || stored === "dark") return stored;
  // Inside Telegram, follow the client's scheme; otherwise the OS preference.
  const tg = getTelegramColorScheme();
  if (tg) return tg;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [accent, setAccent] = useState<Accent>(() =>
    storage.get(STORAGE_KEYS.accent) === "blue" ? "blue" : "lavender"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset.accent = accent;
    storage.set(STORAGE_KEYS.theme, theme);
    storage.set(STORAGE_KEYS.accent, accent);
    const css = getComputedStyle(root);
    const header = css
      .getPropertyValue("--color-bg")
      .trim()
      .split(/\s+/)
      .map((c) => Number(c).toString(16).padStart(2, "0"))
      .join("");
    setTelegramColors(`#${header}`, css.getPropertyValue("--bg-end").trim());
  }, [theme, accent]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
