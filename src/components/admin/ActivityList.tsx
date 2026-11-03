import { Archive, Eye, EyeOff, History, KeyRound, LogIn, LogOut, Mail, Pencil, Plus, ShieldAlert, Trash2, Upload, type LucideIcon } from "lucide-react";
import { activityLabel, dateTime } from "@/lib/admin-format";
import { AdminItem, type IconTone } from "./AdminItem";

export type ActivityRow = { at: Date; action: string; summary: string | null; user?: string | null };

// Kotoha picks the icon by the verb at the end of the code ("project.publish" → eye).
const VERB: Record<string, LucideIcon> = {
  create: Plus,
  save: Pencil,
  publish: Eye,
  unpublish: EyeOff,
  archive: Archive,
  archived: Archive,
  upload: Upload,
  delete: Trash2,
  trash: Trash2,
  login: LogIn,
  logout: LogOut,
};

function look(code: string): [LucideIcon, IconTone] {
  if (code === "auth.login_failed") return [ShieldAlert, "danger"];
  if (code === "auth.password_change") return [KeyRound, "account"];
  const verb = code.split(".").pop()!.split("_")[0];
  const tone: IconTone = code.startsWith("message.") ? "messages" : code.startsWith("auth.") ? "account" : "content";
  return [VERB[verb] ?? (code.startsWith("message.") ? Mail : History), tone];
}

/** Activity log rows (Kotoha): icon by verb, readable label, user pill + PH time, details line. */
export function ActivityList({ rows }: { rows: ActivityRow[] }) {
  return (
    <div className="items">
      {rows.map((r, i) => {
        const [Icon, tone] = look(r.action);
        return (
          <AdminItem
            key={i}
            icon={Icon}
            iconTone={tone}
            title={<span title={r.action}>{activityLabel(r.action)}</span>}
            meta={
              <>
                {r.user ? <span className="apill apill--admin">{r.user}</span> : null}
                <time dateTime={new Date(r.at).toISOString()}>{dateTime(r.at)} PH time</time>
              </>
            }
            text={r.summary ?? undefined}
          />
        );
      })}
    </div>
  );
}
