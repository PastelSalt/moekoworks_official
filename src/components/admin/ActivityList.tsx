import { Award, FileImage, FolderKanban, KeyRound, LogIn, Mail, Shapes, ShieldAlert, type LucideIcon } from "lucide-react";
import { activityLabel, dateTime } from "@/lib/admin-format";

export type ActivityRow = { at: Date; action: string; summary: string | null };

function iconOf(code: string): [LucideIcon, string] {
  if (code === "auth.login_failed") return [ShieldAlert, "danger"];
  if (code === "auth.password_change") return [KeyRound, "account"];
  if (code.startsWith("auth.")) return [LogIn, "account"];
  if (code.startsWith("project.")) return [FolderKanban, "content"];
  if (code.startsWith("certification.")) return [Award, "content"];
  if (code.startsWith("tech.")) return [Shapes, "content"];
  if (code.startsWith("media.")) return [FileImage, "content"];
  if (code.startsWith("message.")) return [Mail, "messages"];
  return [FolderKanban, "account"];
}

/** Activity log rows: icon + readable label + summary + PH time. */
export function ActivityList({ rows, compact = false }: { rows: ActivityRow[]; compact?: boolean }) {
  return (
    <ul className={`alist${compact ? " alist--compact" : ""}`}>
      {rows.map((r, i) => {
        const [Icon, tone] = iconOf(r.action);
        return (
          <li key={i} className="alist__row">
            <span className={`alist__icon alist__icon--${tone}`} aria-hidden="true">
              <Icon size={16} />
            </span>
            <span className="alist__text">
              <strong title={r.action}>{activityLabel(r.action)}</strong>
              {r.summary ? <span className="alist__summary">{r.summary}</span> : null}
            </span>
            <time className="alist__when" dateTime={new Date(r.at).toISOString()}>
              {dateTime(r.at)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
