import { AnimatePresence } from "framer-motion";
import { Smartphone, X } from "lucide-react";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { AirportsView } from "./components/AirportsView";
import { BottomNav, type Tab } from "./components/BottomNav";
import { ConvertView } from "./components/ConvertView";
import { DirectionsView } from "./components/DirectionsView";
import { Login } from "./components/Login";
import { PromoView } from "./components/PromoView";
import { SettingsView } from "./components/SettingsView";
import { TopBar } from "./components/TopBar";

// Stats pulls in the (heavy) charting lib — load it only when opened.
const StatsView = lazy(() =>
  import("./components/StatsView").then((m) => ({ default: m.StatsView }))
);
import { useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { useLocale } from "./contexts/LocaleContext";
import { useToast } from "./contexts/ToastContext";
import { addToHomeScreen, checkHomeScreen, getStartParam, initTelegram } from "./core/telegram";
import { Button } from "./ui/Button";
import { FullScreenSpinner, Spinner } from "./ui/Spinner";

function AppShell() {
  const [tab, setTab] = useState<Tab>("directions");
  const [airportsOpen, setAirportsOpen] = useState(false);
  const [statsTarget, setStatsTarget] = useState<{ src: string; dst: string } | null>(null);

  const openStats = (src: string, dst: string) => {
    setStatsTarget({ src, dst });
    setTab("stats");
  };

  let content: React.ReactNode;
  if (airportsOpen) {
    content = <AirportsView key="airports" onBack={() => setAirportsOpen(false)} />;
  } else {
    switch (tab) {
      case "directions":
        content = <DirectionsView key="directions" onOpenStats={openStats} />;
        break;
      case "stats":
        content = (
          <Suspense
            key="stats"
            fallback={
              <div className="flex justify-center py-24">
                <Spinner className="h-7 w-7" />
              </div>
            }
          >
            <StatsView initial={statsTarget} />
          </Suspense>
        );
        break;
      case "promo":
        content = <PromoView key="promo" />;
        break;
      case "convert":
        content = <ConvertView key="convert" />;
        break;
      case "settings":
        content = <SettingsView key="settings" onOpenAirports={() => setAirportsOpen(true)} />;
        break;
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main>
        <AnimatePresence mode="wait">{content}</AnimatePresence>
      </main>
      {!airportsOpen && <BottomNav tab={tab} onChange={setTab} />}
    </div>
  );
}

export default function App() {
  const { status } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const homeScreenPrompted = useRef(false);
  const [homeScreen, setHomeScreen] = useState<"hidden" | "offer" | "help">("hidden");

  useEffect(() => {
    initTelegram();
  }, []);

  useEffect(() => {
    if (homeScreenPrompted.current) return;
    if (getStartParam() !== "install") return;
    homeScreenPrompted.current = true;
    checkHomeScreen((status) => {
      if (status === "unsupported") toast(t.homeScreen_unsupported);
      if (status === "added") toast(t.homeScreen_added);
      if (status === "missed" || status === "unknown") setHomeScreen("offer");
    });
  }, [t, toast]);

  if (status === "loading") return <FullScreenSpinner label={t.loading} />;
  if (status === "anonymous") return <Login />;

  return (
    <ChatProvider>
      <AppShell />
      {homeScreen !== "hidden" && (
        <div className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-xl2 border border-border bg-card p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
            <p className="flex-1 whitespace-pre-line text-[15px] leading-relaxed text-text">
              {homeScreen === "help" ? t.homeScreen_help : t.homeScreen_offer}
            </p>
            <button
              type="button"
              onClick={() => setHomeScreen("hidden")}
              aria-label={t.close}
              className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Button
            size="lg"
            full
            className="mt-4"
            onClick={() => {
              setHomeScreen("hidden");
              addToHomeScreen(
                () => {
                  setHomeScreen("hidden");
                  toast(t.homeScreen_done, "success");
                },
                () => setHomeScreen("help")
              );
            }}
          >
            {homeScreen === "help" ? t.retry : t.add}
          </Button>
        </div>
      )}
    </ChatProvider>
  );
}
