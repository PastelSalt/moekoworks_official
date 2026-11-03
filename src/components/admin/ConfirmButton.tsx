"use client";

import { type ReactNode, useState } from "react";
import { AdminDialog } from "./AdminDialog";

/** A button that asks first (Kotoha's confirmAction). `run` returns false to keep the dialog open. */
export function ConfirmButton({
  children,
  className = "abtn abtn--ghost abtn--sm",
  title,
  message,
  confirmLabel,
  danger = false,
  disabled = false,
  run,
}: {
  children: ReactNode;
  className?: string;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  disabled?: boolean;
  run: () => Promise<boolean | void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      if ((await run()) !== false) setOpen(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button type="button" className={className} disabled={disabled} onClick={() => setOpen(true)}>
        {children}
      </button>
      <AdminDialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={title}
        actions={
          <>
            <button type="button" className="abtn abtn--ghost" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className={danger ? "abtn abtn--danger" : "abtn abtn--primary"} disabled={busy} onClick={confirm} autoFocus>
              {busy ? "Working…" : confirmLabel}
            </button>
          </>
        }
      >
        <p>{message}</p>
      </AdminDialog>
    </>
  );
}
