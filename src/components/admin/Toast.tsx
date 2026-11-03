"use client";

import { Check, CircleAlert, Info } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

type Kind = "ok" | "error" | "info";
type Item = { id: number; message: string; kind: Kind; leaving: boolean };
const ICONS = { ok: Check, error: CircleAlert, info: Info };

const ToastContext = createContext<(message: string, kind?: Kind) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

let seq = 0;

/** Kotoha toasts: bottom-right stack, icon circle, colour by kind, fade up and down. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const show = useCallback((message: string, kind: Kind = "ok") => {
    const id = ++seq;
    setItems((list) => [...list, { id, message, kind, leaving: false }]);
    window.setTimeout(() => setItems((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t))), kind === "error" ? 6000 : 3500);
    window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), kind === "error" ? 6400 : 3900);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div key={t.id} className={`toast toast--${t.kind}${t.leaving ? " is-leaving" : ""}`} role={t.kind === "error" ? "alert" : undefined}>
              <span className="toast__icon" aria-hidden="true">
                <Icon size={16} />
              </span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
