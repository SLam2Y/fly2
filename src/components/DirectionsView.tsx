import { AnimatePresence } from "framer-motion";
import { Play, Plane, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getDirections, removeDirection, runCheck } from "../core/api";
import type { Direction } from "../core/types";
import { useChat } from "../contexts/ChatContext";
import { useLocale } from "../contexts/LocaleContext";
import { useToast } from "../contexts/ToastContext";
import { useAirports } from "../hooks/useAirports";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { EmptyState, ErrorState, Page } from "../ui/Page";
import { Spinner } from "../ui/Spinner";
import { DirectionCard } from "./DirectionCard";
import { DirectionForm } from "./DirectionForm";

export function DirectionsView({ onOpenStats }: { onOpenStats: (src: string, dst: string) => void }) {
  const { t } = useLocale();
  const { toast } = useToast();
  const { info, refresh: refreshInfo } = useChat();
  const { airports } = useAirports();

  const [directions, setDirections] = useState<Direction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Direction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Direction | null>(null);
  const [running, setRunning] = useState(false);

  const currency = info?.currency ?? "EUR";

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setDirections(await getDirections());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSaved = useCallback(async () => {
    await Promise.all([load(), refreshInfo()]);
  }, [load, refreshInfo]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await removeDirection(pendingDelete.src, pendingDelete.dst);
      toast(t.dir_removed, "success");
      setPendingDelete(null);
      await onSaved();
    } catch (e) {
      toast(e instanceof Error ? e.message : t.errGeneric, "error");
    }
  };

  const onRun = async () => {
    setRunning(true);
    try {
      await runCheck();
      toast(t.dir_runStarted, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t.errGeneric, "error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Page title={t.dir_title}>
      <Button
        full
        className="mb-4"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      >
        <Plus className="h-4 w-4" /> {t.dir_add}
      </Button>
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : error ? (
        <ErrorState message={t.errGeneric} onRetry={load} retryLabel={t.retry} />
      ) : directions.length === 0 ? (
        <EmptyState icon={<Plane className="h-8 w-8" />} message={t.dir_empty} />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {directions.map((d) => (
                <DirectionCard
                  key={`${d.src}-${d.dst}`}
                  direction={d}
                  currency={currency}
                  airports={airports}
                  onEdit={() => {
                    setEditing(d);
                    setFormOpen(true);
                  }}
                  onDelete={() => setPendingDelete(d)}
                  onStats={() => onOpenStats(d.src, d.dst)}
                />
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-5">
            <Button
              variant="ghost"
              full
              loading={running}
              onClick={onRun}
              className="border border-accent/40 bg-card font-semibold"
            >
              <Play className="h-4 w-4 text-accent" /> {t.dir_runNow}
            </Button>
          </div>
        </>
      )}

      <DirectionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={onSaved}
        airports={airports}
        editing={editing}
      />

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={pendingDelete ? t.dir_deleteConfirm(pendingDelete.src, pendingDelete.dst) : ""}
      >
        <div className="flex gap-2">
          <Button variant="ghost" full onClick={() => setPendingDelete(null)}>
            {t.cancel}
          </Button>
          <Button variant="danger" full onClick={confirmDelete}>
            {t.delete}
          </Button>
        </div>
      </Modal>
    </Page>
  );
}
