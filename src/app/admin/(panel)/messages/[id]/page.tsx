import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageActions } from "@/components/admin/MessageActions";
import { bubbleColor, dateTime } from "@/lib/admin-format";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Message" };

const FOLDER_OF: Record<string, string> = { unread: "inbox", read: "inbox", archived: "archived", spam: "spam", trash: "trash" };

export default async function MessagePage({ params }: PageProps<"/admin/messages/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [msg] = await db.select().from(schema.contactMessages).where(eq(schema.contactMessages.id, id)).limit(1);
  if (!msg) notFound();

  const quoted = msg.body
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n")
    .slice(0, 1400);
  const mailto = `mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent(`Re: ${msg.subject}`)}&body=${encodeURIComponent(`\n\n\nOn ${dateTime(msg.createdAt)}, ${msg.name} wrote:\n${quoted}`)}`;
  const folder = FOLDER_OF[msg.status] ?? "inbox";
  const meta = [
    ["Received", `${dateTime(msg.createdAt)} (PH time)`],
    ["Page", msg.pagePath ?? "—"],
    ["Device", [msg.deviceType, msg.browser].filter(Boolean).join(" · ") || "—"],
    ["Country", msg.country ?? "—"],
    ["Came from", msg.referrerHost ?? "—"],
    ["Spam score", String(msg.spamScore)],
    ...(msg.repliedAt ? [["Replied", dateTime(msg.repliedAt)]] : []),
  ];

  return (
    <>
      <Link className="admin-back" href={`/admin/messages${folder === "inbox" ? "" : `?folder=${folder}`}`}>
        ← Back to {folder === "inbox" ? "Inbox" : folder[0].toUpperCase() + folder.slice(1)}
      </Link>
      <section className="panel msg-panel">
        <div className="msg-head">
          <span className="msglist__bubble msglist__bubble--lg" style={{ background: bubbleColor(msg.email) }} aria-hidden="true">
            {msg.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="msg-head__from">
              <strong>{msg.name}</strong> <span>&lt;{msg.email}&gt;</span>
            </p>
            <p className="msg-head__folder">{msg.status === "spam" ? "In Spam" : msg.status === "trash" ? "In Trash" : msg.status === "archived" ? "Archived" : "Inbox"}</p>
          </div>
          {msg.starred ? <span className="apill apill--star">★ Starred</span> : null}
        </div>
        <h1 className="msg-subject">{msg.subject}</h1>
        {/* Plain text only: line breaks kept, nothing is turned into a clickable link. */}
        <div className="msg-body">{msg.body}</div>
        <dl className="msg-meta">
          {meta.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <MessageActions id={msg.id} status={msg.status} starred={msg.starred} email={msg.email} mailto={mailto} />
      </section>
      <p className="form-hint">Shortcuts: e archive · s star · # trash</p>
    </>
  );
}
