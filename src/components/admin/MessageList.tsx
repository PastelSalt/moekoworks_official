"use client";

import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Tooltip from "@mui/material/Tooltip";
import { Archive, MailOpen, Mail, RotateCcw, ShieldAlert, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { bulkMessages } from "@/server/admin/messages";

export type MessageRow = { id: number; name: string; email: string; subject: string; snippet: string; status: string; starred: boolean; when: string; bubble: string };

/** Inbox rows with checkboxes and a bulk-action bar (plain form posts: works without JavaScript too). */
export function MessageList({ rows, folder, back }: { rows: MessageRow[]; folder: string; back: string }) {
  const [selected, setSelected] = useState<number[]>([]);
  const all = rows.length > 0 && selected.length === rows.length;
  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const ops =
    folder === "trash"
      ? [{ op: "restore", label: "Restore", icon: RotateCcw }]
      : folder === "spam"
        ? [
            { op: "restore", label: "Not spam", icon: RotateCcw },
            { op: "trash", label: "Trash", icon: Trash2 },
          ]
        : [
            { op: "read", label: "Mark read", icon: MailOpen },
            { op: "unread", label: "Mark unread", icon: Mail },
            { op: "archive", label: "Archive", icon: Archive },
            { op: "spam", label: "Spam", icon: ShieldAlert },
            { op: "trash", label: "Trash", icon: Trash2 },
          ];

  return (
    <form action={bulkMessages}>
      <input type="hidden" name="back" value={back} />
      {selected.map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}
      <div className="bulkbar">
        <Checkbox
          checked={all}
          indeterminate={selected.length > 0 && !all}
          onChange={() => setSelected(all ? [] : rows.map((r) => r.id))}
          slotProps={{ input: { "aria-label": "Select all messages on this page" } }}
        />
        {ops.map(({ op, label, icon: Icon }) => (
          <Button key={op} type="submit" name="op" value={op} size="small" variant="outlined" color="inherit" disabled={!selected.length} startIcon={<Icon size={16} aria-hidden />}>
            {label}
          </Button>
        ))}
        {selected.length ? <span className="form-hint">{selected.length} selected</span> : null}
      </div>
      <div className="panel panel--flush">
        <ul className="msglist">
          {rows.map((r) => (
            <li key={r.id} className="msglist__row" data-unread={r.status === "unread" ? "1" : "0"}>
              <Checkbox checked={selected.includes(r.id)} onChange={() => toggle(r.id)} slotProps={{ input: { "aria-label": `Select message from ${r.name}` } }} />
              <span className="msglist__bubble" style={{ background: r.bubble }} aria-hidden="true">
                {r.name.slice(0, 1).toUpperCase()}
              </span>
              <Link className="msglist__link" href={`/admin/messages/${r.id}`}>
                <span className="msglist__from">
                  {r.status === "unread" ? <span className="msglist__dot" aria-label="Unread" /> : null}
                  <strong>{r.name}</strong>
                  <span className="msglist__email">{r.email}</span>
                </span>
                <span className="msglist__subject">
                  <strong>{r.subject}</strong> <span className="msglist__snippet">— {r.snippet}</span>
                </span>
              </Link>
              {r.starred ? (
                <Tooltip title="Starred">
                  <Star size={16} className="msglist__star" aria-label="Starred" />
                </Tooltip>
              ) : null}
              <span className="msglist__when">{r.when}</span>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
