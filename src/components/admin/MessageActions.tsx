"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Archive, Copy, Inbox, Reply, RotateCcw, ShieldAlert, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { deleteMessageForever, markReplied, setMessageStatus, toggleStar } from "@/server/admin/messages";

type Props = { id: number; status: string; starred: boolean; email: string; mailto: string };

/** Detail actions + keyboard shortcuts (e archive · s star · # trash). Opening an unread message marks it read. */
export function MessageActions({ id, status, starred, email, mailto }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = (fn: () => Promise<unknown>, then?: string) =>
    start(async () => {
      await fn();
      if (then) router.push(then);
      else router.refresh();
    });

  useEffect(() => {
    if (status === "unread") setMessageStatus(id, "read").then(() => router.refresh());
  }, [id, status, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "e" && status !== "archived") start(async () => (await setMessageStatus(id, "archived"), router.push("/admin/messages")));
      if (e.key === "s") start(async () => (await toggleStar(id, !starred), router.refresh()));
      if (e.key === "#" && status !== "trash") start(async () => (await setMessageStatus(id, "trash"), router.push("/admin/messages")));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, status, starred, router]);

  return (
    <div className="msg-actions">
      <Button variant="contained" href={mailto} onClick={() => markReplied(id)} startIcon={<Reply size={16} aria-hidden />}>
        Reply via e-mail
      </Button>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<Copy size={16} aria-hidden />}
        onClick={async () => {
          await navigator.clipboard.writeText(email).catch(() => undefined);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }}
      >
        {copied ? "Copied!" : "Copy e-mail"}
      </Button>
      <Button color="inherit" disabled={pending} onClick={() => run(() => toggleStar(id, !starred))} startIcon={<Star size={16} fill={starred ? "currentColor" : "none"} aria-hidden />} title="Star (s)">
        {starred ? "Unstar" : "Star"}
      </Button>
      {status === "trash" ? (
        <>
          <Button color="inherit" disabled={pending} onClick={() => run(() => setMessageStatus(id, "read"), "/admin/messages")} startIcon={<RotateCcw size={16} aria-hidden />}>
            Restore
          </Button>
          <Button color="error" disabled={pending} onClick={() => setConfirm(true)} startIcon={<Trash2 size={16} aria-hidden />}>
            Delete permanently
          </Button>
        </>
      ) : (
        <>
          {status === "archived" || status === "spam" ? (
            <Button color="inherit" disabled={pending} onClick={() => run(() => setMessageStatus(id, "read"), "/admin/messages")} startIcon={<Inbox size={16} aria-hidden />}>
              {status === "spam" ? "Not spam" : "Move to Inbox"}
            </Button>
          ) : (
            <Button color="inherit" disabled={pending} onClick={() => run(() => setMessageStatus(id, "archived"), "/admin/messages")} startIcon={<Archive size={16} aria-hidden />} title="Archive (e)">
              Archive
            </Button>
          )}
          {status !== "spam" ? (
            <Button color="inherit" disabled={pending} onClick={() => run(() => setMessageStatus(id, "spam"), "/admin/messages")} startIcon={<ShieldAlert size={16} aria-hidden />}>
              Spam
            </Button>
          ) : null}
          <Button color="inherit" disabled={pending} onClick={() => run(() => setMessageStatus(id, "trash"), "/admin/messages")} startIcon={<Trash2 size={16} aria-hidden />} title="Trash (#)">
            Trash
          </Button>
        </>
      )}

      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>Delete this message permanently?</DialogTitle>
        <DialogContent>It will be gone for good. This can&apos;t be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)}>Keep it</Button>
          <Button color="error" variant="contained" onClick={() => run(() => deleteMessageForever(id))}>
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
