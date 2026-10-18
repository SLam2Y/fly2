/**
 * API configuration. Detects environment by hostname (web).
 * On React Native, swap this module for one that reads from app config / env.
 */

const isBrowser = typeof window !== "undefined" && typeof window.location !== "undefined";

const isDevelopment =
  isBrowser &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (isDevelopment ? "http://localhost:8000" : "https://flytwo.servebeer.com");

// localStorage / persisted keys (namespaced)
export const STORAGE_KEYS = {
  token: "fly2_token",
  theme: "fly2_theme",
  accent: "fly2_accent",
  locale: "fly2_locale",
} as const;
