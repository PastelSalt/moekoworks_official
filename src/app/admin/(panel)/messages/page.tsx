import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
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
      <p className="admin-label">No.05 — Messages</p>
      <Typography variant="h4" component="h1" sx={{ mt: 0.5, mb: 2 }}>
        Messages
      </Typography>

      <nav className="admin-tabs" aria-label="Folders">
        {FOLDERS.map((f) => (
          <Link key={f.key} href={href({ folder: f.key, q: undefined })} aria-current={folder === f.key ? "page" : undefined} className="admin-tab">
            {f.label}
            {badge[f.key] ? <Chip label={badge[f.key]} size="small" color={f.key === "spam" ? "default" : "primary"} sx={{ ml: 1, height: 20 }} /> : null}
          </Link>
        ))}
      </nav>

      <form className="admin-search" action="/admin/messages" role="search">
        {folder !== "inbox" ? <input type="hidden" name="folder" value={folder} /> : null}
        <TextField name="q" defaultValue={q} size="small" placeholder="Search name, e-mail, subject or message" slotProps={{ htmlInput: { "aria-label": "Search messages", maxLength: 100 } }} sx={{ flex: 1 }} />
        <Button type="submit" variant="contained">
          Search
        </Button>
        {q ? (
          <Button component={Link} href={href({ q: undefined })} color="inherit">
            Clear
          </Button>
        ) : null}
      </form>

      {folder === "spam" || folder === "trash" ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Messages in {folder === "spam" ? "Spam" : "Trash"} are deleted automatically after 30 days.
        </Alert>
      ) : null}

      {list.length ? (
        <MessageList rows={list} folder={folder} back={href({ page })} />
      ) : (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
          {q ? "No messages match your search." : folder === "inbox" ? "No messages yet. They'll appear here when someone uses the contact form ✿" : "Nothing here."}
        </Typography>
      )}

      {pages > 1 ? (
        <div className="admin-pager">
          <Button component={Link} href={href({ page: page - 1 })} disabled={page <= 1}>
            ← Newer
          </Button>
          <span className="admin-label">
            Page {page} / {pages}
          </span>
          <Button component={Link} href={href({ page: page + 1 })} disabled={page >= pages}>
            Older →
          </Button>
        </div>
      ) : null}
    </>
  );
}
