"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { TOAST_CONFIG, ToastRegion, type QueuedToast, type ToastInput } from "./toast";

export type { ToastInput, ToastTone } from "./toast";

type ToastContextValue = {
  // Returns an id so the caller can take the toast away early.
  showToast: (toast: ToastInput) => number;
  // Safe at any point: before or after the toast's own timer has fired, or
  // after the toast is gone entirely.
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type ToastTimers = {
  visible?: number;
  exit?: number;
};

type ToastProviderProps = {
  children: ReactNode;
};

// One region for the whole app, so a feature only has to say what to show.
// Layout and exit behaviour are those of the former ConnectionRestoredToast
// (ADR 0046).
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<QueuedToast[]>([]);
  const nextId = useRef(0);
  // Every toast that has not been removed yet has an entry here; the entry is
  // what makes dismissing idempotent and what guarantees no timer is left
  // running once the toast is gone.
  const timers = useRef(new Map<number, ToastTimers>());

  const remove = useCallback((id: number) => {
    const entry = timers.current.get(id);

    if (!entry) return;

    window.clearTimeout(entry.visible);
    window.clearTimeout(entry.exit);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const dismissToast = useCallback(
    (id: number) => {
      const entry = timers.current.get(id);

      // Gone already, or already on its way out: nothing to do.
      if (!entry || entry.exit !== undefined) return;

      window.clearTimeout(entry.visible);
      entry.visible = undefined;
      entry.exit = window.setTimeout(() => remove(id), TOAST_CONFIG.exitFallbackMs);
      setToasts((current) =>
        current.map((toast) => (toast.id === id ? { ...toast, isLeaving: true } : toast)),
      );
    },
    [remove],
  );

  const showToast = useCallback(
    ({ message, tone = "neutral", durationMs = TOAST_CONFIG.visibleMs }: ToastInput) => {
      const id = nextId.current;
      nextId.current += 1;

      timers.current.set(id, {
        visible: window.setTimeout(() => dismissToast(id), durationMs),
      });
      setToasts((current) => [...current, { id, message, tone, isLeaving: false }]);

      return id;
    },
    [dismissToast],
  );

  // Nothing outlives the provider.
  useEffect(() => {
    const pending = timers.current;

    return () => {
      for (const entry of pending.values()) {
        window.clearTimeout(entry.visible);
        window.clearTimeout(entry.exit);
      }
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} onExited={remove} />
    </ToastContext.Provider>
  );
};

// Throws rather than returning a no-op: a toast that silently never appears
// because a provider is missing is a bug that hides itself.
export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
};
