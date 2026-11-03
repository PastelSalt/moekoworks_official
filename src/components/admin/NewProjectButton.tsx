"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { createProject } from "@/server/admin/projects";
import { AdminDialog } from "./AdminDialog";

/** Primary "New project" in the page head; the title goes to the existing createProject action (it opens the editor). */
export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className="abtn abtn--primary" onClick={() => setOpen(true)}>
        <Plus aria-hidden /> New project
      </button>
      <AdminDialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="New project"
        actions={
          <>
            <button type="button" className="abtn abtn--ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="new-project" className="abtn abtn--primary" disabled={busy}>
              {busy ? "Creating…" : "Create draft"}
            </button>
          </>
        }
      >
        <form id="new-project" action={createProject} onSubmit={() => setBusy(true)} className="aform">
          <div className="afield">
            <label htmlFor="np-title">Title</label>
            <input id="np-title" name="title" required maxLength={80} autoFocus autoComplete="off" />
          </div>
          <p className="form-hint">It starts as a draft. Fill it in, then press “Save & publish”. The newest published project becomes “Latest” on the home page.</p>
        </form>
      </AdminDialog>
    </>
  );
}
