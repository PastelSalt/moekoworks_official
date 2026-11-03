import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import type { Metadata } from "next";
import { Mail, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { AdminPageHead } from "@/components/admin/AdminPageHead";
import { SegmentedLinks } from "@/components/admin/Segmented";
import { StateBox } from "@/components/admin/StateBox";
import { MessageList, type MessageRow } from "@/components/admin/MessageList";
import { bubbleColor, relativeTime } from "@/lib/admin-format";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Messages" };

const PER_PAGE = 25;
const FOLDERS = [
  { key: "inbox", label: "Inbox" },
  { key: "starred", label: "Starred" },
  { key: "archived", label: "Archived" },
  { key: "spam", label: "Spam" },
  { key: "trash", label: "Trash" },
] as const;
type Folder = (typeof FOLDERS)[number]["key"];

const m = schema.contactMessages;
function folderWhere(folder: Folder): SQL | undefined {
  switch (folder) {
    case "starred":
      return and(eq(m.starred, true), inArray(m.status, ["unread", "read", "archived"]));
    case "archived":
      return eq(m.status, "archived");
    case "spam":
      return eq(m.status, "spam");
    case "trash":
      return eq(m.status, "trash");
    default:
      return inArray(m.status, ["unread", "read"]);
  }
}

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdmin();
  const sp = await searchParams;
  const folder = (FOLDERS.find((f) => f.key === sp.folder)?.key ?? "inbox") as Folder;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const where = and(folderWhere(folder), q ? or(ilike(m.name, like), ilike(m.email, like), ilike(m.subject, like), ilike(m.body, like)) : undefined);

  const [rows, [{ value: total }], counts] = await Promise.all([
    db
      .select({ id: m.id, name: m.name, email: m.email, subject: m.subject, body: m.body, status: m.status, starred: m.starred, createdAt: m.createdAt })
      .from(m)
      .where(where)
      .orderBy(desc(m.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ value: count() }).from(m).where(where),
    db.select({ status: m.status, value: count() }).from(m).groupBy(m.status),
  ]);
  const n = (s: string) => counts.find((c) => c.status === s)?.value ?? 0;
  const badge: Record<Folder, number> = { inbox: n("unread"), starred: 0, archived: 0, spam: n("spam"), trash: 0 };
  const list: MessageRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    subject: r.subject,
    snippet: r.body.replace(/\s+/g, " ").slice(0, 120),
    status: r.status,
    starred: r.starred,
    when: relativeTime(r.createdAt),
    bubble: bubbleColor(r.email),
  }));
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const href = (p: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { folder, q: q || undefined, page: undefined, ...p };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && !(k === "folder" && v === "inbox") && !(k === "page" && String(v) === "1")) params.set(k, String(v));
    const s = params.toString();
    return `/admin/messages${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminPageHead href="/admin/messages" hint="Messages from the contact form. Reply by e-mail; nothing is sent from here." />

      <div className="atoolbar">
        <SegmentedLinks label="Folders" items={FOLDERS.map((f) => ({ href: href({ folder: f.key, q: undefined }), label: f.label, count: badge[f.key] || undefined, active: folder === f.key }))} />
        <form className="search-box" action="/admin/messages" role="search">
          {folder !== "inbox" ? <input type="hidden" name="folder" value={folder} /> : null}
          <Search aria-hidden />
          <input name="q" defaultValue={q} placeholder="Search name, e-mail, subject or message" aria-label="Search messages" maxLength={100} />
          <button type="submit" className="abtn abtn--primary abtn--sm">
            Search
          </button>
          {q ? (
            <Link href={href({ q: undefined })} className="abtn abtn--ghost abtn--sm">
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      {folder === "spam" || folder === "trash" ? <p className="note-box">Messages in {folder === "spam" ? "Spam" : "Trash"} are deleted automatically after 30 days.</p> : null}

      {list.length ? (
        <MessageList rows={list} folder={folder} back={href({ page })} />
      ) : (
        <StateBox icon={q ? SearchX : Mail}>{q ? "No messages match your search." : folder === "inbox" ? "No messages yet. They'll appear here when someone uses the contact form ✿" : "Nothing here."}</StateBox>
      )}

      {pages > 1 ? (
        <div className="admin-pager">
          {page > 1 ? (
            <Link className="abtn abtn--ghost" href={href({ page: page - 1 })}>
              ← Newer
            </Link>
          ) : null}
          <span className="form-hint">
            Page {page} / {pages}
          </span>
          {page < pages ? (
            <Link className="abtn abtn--ghost" href={href({ page: page + 1 })}>
              Older →
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
