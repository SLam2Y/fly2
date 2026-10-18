/**
 * Thin wrapper around the Telegram Mini App runtime (telegram-web-app.js).
 * Everything degrades gracefully to no-ops in a normal browser.
 */

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { start_param?: string };
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  ready: () => void;
  expand: () => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
  isVersionAtLeast?: (version: string) => boolean;
  addToHomeScreen?: () => void;
  checkHomeScreenStatus?: (cb: (status: HomeScreenStatus) => void) => void;
}

export type HomeScreenStatus = "unsupported" | "unknown" | "added" | "missed";

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

/** True only when launched inside Telegram (initData is signed and present). */
export function isTelegramMiniApp(): boolean {
  const wa = getWebApp();
  return !!wa && typeof wa.initData === "string" && wa.initData.length > 0;
}

export function getStartParam(): string | null {
  return getWebApp()?.initDataUnsafe?.start_param ?? null;
}

export function getInitData(): string | null {
  const wa = getWebApp();
  return wa && wa.initData ? wa.initData : null;
}

export function getTelegramColorScheme(): "light" | "dark" | null {
  const wa = getWebApp();
  return wa ? wa.colorScheme : null;
}

/**
 * Open an external URL. Inside Telegram, hand it to the client's openLink so it
 * launches the system browser; otherwise open a new tab.
 */
export function openExternal(url: string): void {
  const wa = getWebApp();
  if (wa?.openLink) {
    wa.openLink(url);
    return;
  }
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** Signal readiness and request full-height layout. Safe to call always. */
export function initTelegram(): void {
  const wa = getWebApp();
  if (!wa) return;
  try {
    wa.ready();
    wa.expand();
  } catch {
    /* ignore */
  }
}

export function checkHomeScreen(onStatus: (status: HomeScreenStatus) => void): void {
  const wa = getWebApp();
  if (!isTelegramMiniApp() || !wa?.isVersionAtLeast?.("8.0") || !wa.checkHomeScreenStatus) {
    onStatus("unsupported");
    return;
  }
  let answered = false;
  const timer = window.setTimeout(() => {
    if (!answered) onStatus("unsupported");
    answered = true;
  }, 3000);
  try {
    wa.checkHomeScreenStatus((status) => {
      if (answered) return;
      answered = true;
      window.clearTimeout(timer);
      onStatus(status);
    });
  } catch {
    answered = true;
    window.clearTimeout(timer);
    onStatus("unsupported");
  }
}

export function addToHomeScreen(onAdded: () => void, onNoAnswer: () => void): void {
  const wa = getWebApp();
  if (!wa?.addToHomeScreen) return;
  const timer = window.setTimeout(onNoAnswer, 4000);
  const handler = () => {
    window.clearTimeout(timer);
    wa.offEvent?.("homeScreenAdded", handler);
    onAdded();
  };
  wa.onEvent?.("homeScreenAdded", handler);
  wa.addToHomeScreen();
}

export function setTelegramColors(header: string, background: string): void {
  if (!isTelegramMiniApp()) return;
  const wa = getWebApp();
  try {
    wa?.setHeaderColor?.(header);
    wa?.setBackgroundColor?.(background);
  } catch {
    return;
  }
}
