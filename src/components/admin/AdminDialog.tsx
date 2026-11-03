"use client";

import Dialog from "@mui/material/Dialog";
import type { ReactNode } from "react";

/** Kotoha dialog: title with a pink bar and a dashed line, scrolling body, sticky action row. */
export function AdminDialog({ open, onClose, title, children, actions, wide = false }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; actions: ReactNode; wide?: boolean }) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="adialog-title" slotProps={{ paper: { className: `adialog${wide ? " adialog--wide" : ""}` }, backdrop: { className: "adialog__backdrop" } }}>
      <h2 className="adialog__title" id="adialog-title">
        {title}
      </h2>
      <div className="adialog__body">{children}</div>
      <div className="adialog__actions">{actions}</div>
    </Dialog>
  );
}
