// Display formats shared by the public site and the admin. Dates are shown in Philippine time (GMT+8).
const TZ = process.env.SITE_TIMEZONE ?? "Asia/Manila";

type DateLike = Date | string | null | undefined;

function toDate(value: DateLike): Date | null {
  if (!value) return null;
  // Plain `YYYY-MM-DD` columns are calendar dates: pin them to noon so no timezone can shift the day.
  const d = typeof value === "string" ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00+08:00` : value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

function parts(value: DateLike) {
  const d = toDate(value);
  if (!d) return null;
  const p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** 2026.10.04 — the Japanese-web style used on micro-labels, rows and the NEWS list. */
export function dotDate(value: DateLike) {
  const p = parts(value);
  return p ? `${p.y}.${p.m}.${p.d}` : "";
}

/** 4 Oct 2026 */
export function longDate(value: DateLike) {
  const d = toDate(value);
  return d ? new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(d) : "";
}

/** Oct 2026 */
export function monthYear(value: DateLike) {
  const d = toDate(value);
  return d ? new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", year: "numeric" }).format(d) : "";
}

export function yearOf(value: DateLike) {
  return parts(value)?.y ?? "";
}

/** Machine-readable value for <time dateTime>. */
export function isoDate(value: DateLike) {
  const p = parts(value);
  return p ? `${p.y}-${p.m}-${p.d}` : undefined;
}

/** No.01 */
export const no = (n: number) => `No.${String(n).padStart(2, "0")}`;
export const pad2 = (n: number) => String(n).padStart(2, "0");

export const CATEGORY_LABEL: Record<string, string> = {
  web: "Web platform",
  mobile: "Mobile app",
  desktop: "Desktop app",
  game: "Game",
  tool: "Tool",
  research: "Research",
  concept: "Concept",
  other: "Project",
};

// Matches the projects.lifecycle check constraint.
export const LIFECYCLE_LABEL: Record<string, { label: string; tone: "live" | "build" | "rest" }> = {
  live: { label: "Live", tone: "live" },
  beta: { label: "Beta", tone: "build" },
  in_development: { label: "In development", tone: "build" },
  completed: { label: "Completed", tone: "rest" },
  delivered: { label: "Delivered", tone: "rest" },
  research: { label: "Research", tone: "rest" },
  concept: { label: "Concept", tone: "rest" },
  archived: { label: "Archived", tone: "rest" },
};

export const PLATFORM_LABEL: Record<string, string> = {
  web: "Web",
  android: "Android",
  ios: "iOS",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

/** "Sep 2026 – present" / "Mar 2025 – Jun 2025" / "2026" */
export function timeline(startedOn: string | null, finishedOn: string | null, lifecycle: string) {
  if (!startedOn) return finishedOn ? monthYear(finishedOn) : "";
  const start = monthYear(startedOn);
  if (finishedOn) {
    const end = monthYear(finishedOn);
    return end === start ? start : `${start} – ${end}`;
  }
  return ["live", "beta", "in_development"].includes(lifecycle) ? `${start} – present` : start;
}
