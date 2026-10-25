// Admin-only formatting helpers (times are shown in Philippine time, like the rest of the site).
const TZ = process.env.SITE_TIMEZONE ?? "Asia/Manila";

export function dateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

/** "3 min ago", "yesterday", "12 Sep" */
export function relativeTime(d: Date | string, now = Date.now()) {
  const t = new Date(d).getTime();
  const s = Math.round((now - t) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (s < 60) return "just now";
  if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  if (s < 7 * 86400) return rtf.format(-Math.round(s / 86400), "day");
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", ...(s > 300 * 86400 ? { year: "numeric" } : {}) }).format(new Date(d));
}

/** Pastel bubble colour derived from a name (stable per sender). */
export function bubbleColor(seed: string) {
  const palette = ["#FFD3EE", "#C4E5FE", "#EFD2F8", "#FDF0B8", "#F7DDC0", "#D3F2DC"];
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

/** Readable names for activity-log codes ("project.publish" → "Published a project"). Unknown codes show as they are. */
const ACTIVITY: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.login_failed": "Failed sign-in attempt",
  "auth.logout": "Signed out",
  "auth.logout_others": "Signed out other devices",
  "auth.password_change": "Changed the password",
  "project.create": "Created a project",
  "project.save": "Saved a project",
  "project.publish": "Published a project",
  "project.unpublish": "Unpublished a project",
  "project.archive": "Archived a project",
  "media.upload": "Uploaded a file",
  "media.delete": "Deleted a file",
  "certification.create": "Added a certification",
  "certification.save": "Saved a certification",
  "tech.create": "Added a technology",
  "tech.save": "Saved a technology",
  "message.read": "Marked messages as read",
  "message.unread": "Marked messages as unread",
  "message.archive": "Archived messages",
  "message.archived": "Archived a message",
  "message.spam": "Moved messages to Spam",
  "message.trash": "Moved messages to Trash",
  "message.restore": "Restored messages",
  "message.delete": "Deleted a message permanently",
};
export function activityLabel(code: string) {
  return ACTIVITY[code] ?? code;
}
