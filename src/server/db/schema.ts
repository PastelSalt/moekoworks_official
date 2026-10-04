// Moesoft database schema (plan §15). No "server-only" import here: CLI scripts share this file.
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const id = () => bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

// ── Admin & security ────────────────────────────────────────────────
export const adminUsers = pgTable(
  "admin_users",
  {
    id: id(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    mustChangePassword: boolean("must_change_password").notNull().default(true),
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("admin_users_username_check", sql`${t.username} ~ '^[a-z0-9_.-]{3,40}$'`),
    check("admin_users_failed_login_count_check", sql`${t.failedLoginCount} >= 0`),
  ],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: id(),
    adminUserId: bigint("admin_user_id", { mode: "number" })
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    restricted: boolean("restricted").notNull().default(false),
    createdAt: createdAt(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    userAgent: text("user_agent"),
  },
  (t) => [index("admin_sessions_user_idx").on(t.adminUserId), index("admin_sessions_expires_idx").on(t.expiresAt)],
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: id(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
    ipHash: text("ip_hash").notNull(),
    usernameAttempted: text("username_attempted").notNull(),
    succeeded: boolean("succeeded").notNull(),
  },
  (t) => [
    index("login_attempts_ip_idx").on(t.ipHash, t.attemptedAt.desc()),
    index("login_attempts_user_idx").on(t.usernameAttempted, t.attemptedAt.desc()),
  ],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    bucket: text("bucket").notNull(),
    keyHash: text("key_hash").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    hits: integer("hits").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.bucket, t.keyHash, t.windowStart] })],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: id(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    adminUserId: bigint("admin_user_id", { mode: "number" }).references(() => adminUsers.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: bigint("entity_id", { mode: "number" }),
    summary: text("summary"),
    meta: jsonb("meta").notNull().default({}),
  },
  (t) => [index("activity_log_time_idx").on(t.occurredAt.desc())],
);

// ── Catalog & projects ──────────────────────────────────────────────
export const technologies = pgTable(
  "technologies",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    iconKey: text("icon_key"),
    color: text("color"),
    url: text("url"),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "technologies_category_check",
      sql`${t.category} in ('language','framework','library','runtime','database','cloud','service','tool','design','platform','other')`,
    ),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    tagline: text("tagline").notNull(), // the one-sentence description
    descriptionMd: text("description_md").notNull().default(""), // the full description
    category: text("category").notNull(),
    platforms: text("platforms").array().notNull().default(sql`'{}'::text[]`),
    lifecycle: text("lifecycle").notNull().default("live"),
    role: text("role"),
    startedOn: date("started_on"),
    finishedOn: date("finished_on"),
    credits: jsonb("credits").notNull().default([]),
    accentColor: text("accent_color"),
    accentColor2: text("accent_color_2"),
    accentStrong: text("accent_strong"),
    accentOn: text("accent_on"),
    status: text("status").notNull().default("draft"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    disclaimerMd: text("disclaimer_md"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("projects_slug_check", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(${t.slug}) <= 60`),
    check("projects_title_check", sql`char_length(${t.title}) between 1 and 80`),
    check("projects_tagline_check", sql`char_length(${t.tagline}) between 10 and 160`),
    check("projects_category_check", sql`${t.category} in ('web','mobile','desktop','game','tool','research','concept','other')`),
    check(
      "projects_lifecycle_check",
      sql`${t.lifecycle} in ('live','beta','in_development','completed','delivered','research','concept','archived')`,
    ),
    check("projects_status_check", sql`${t.status} in ('draft','published','archived')`),
    check("projects_accent_check", sql`${t.accentColor} is null or ${t.accentColor} ~ '^#[0-9A-Fa-f]{6}$'`),
    index("projects_status_published_idx").on(t.status, t.publishedAt.desc()),
  ],
);

export const projectSlugHistory = pgTable("project_slug_history", {
  oldSlug: text("old_slug").primaryKey(),
  projectId: bigint("project_id", { mode: "number" })
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

// Cover / preview / gallery / OG are media roles (no circular project → media keys).
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: id(),
    projectId: bigint("project_id", { mode: "number" }).references(() => projects.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    role: text("role").notNull().default("gallery"),
    publicId: text("public_id").notNull().unique(),
    version: bigint("version", { mode: "number" }).notNull(),
    format: text("format").notNull(),
    width: integer("width"),
    height: integer("height"),
    bytes: bigint("bytes", { mode: "number" }),
    durationMs: integer("duration_ms"),
    frame: text("frame").notNull().default("auto"),
    altText: text("alt_text"),
    caption: text("caption"),
    dominantColor: text("dominant_color"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    check("media_assets_kind_check", sql`${t.kind} in ('image','video')`),
    check(
      "media_assets_role_check",
      sql`${t.role} in ('gallery','cover','preview','hover','operation','og','certificate','site')`,
    ),
    check("media_assets_frame_check", sql`${t.frame} in ('auto','browser','phone','tablet','window','none')`),
    index("media_assets_project_idx").on(t.projectId, t.role, t.sortOrder),
  ],
);

export const projectLinks = pgTable(
  "project_links",
  {
    id: id(),
    projectId: bigint("project_id", { mode: "number" })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    label: text("label"),
    url: text("url").notNull(),
    note: text("note"),
    isPrimary: boolean("is_primary").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    // No source-code link type, ever (owner rule).
    check(
      "project_links_kind_check",
      sql`${t.kind} in ('live','apk','exe','msi','dmg','appimage','ios','play_store','app_store','docs','demo_video','paper','other')`,
    ),
    check("project_links_url_check", sql`${t.url} ~ '^https://'`),
  ],
);

export const projectTechnologies = pgTable(
  "project_technologies",
  {
    projectId: bigint("project_id", { mode: "number" })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    technologyId: bigint("technology_id", { mode: "number" })
      .notNull()
      .references(() => technologies.id, { onDelete: "restrict" }),
    usageNote: text("usage_note"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.technologyId] })],
);

export const projectOperations = pgTable(
  "project_operations",
  {
    id: id(),
    projectId: bigint("project_id", { mode: "number" })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    audience: text("audience").notNull().default("visitor"),
    title: text("title").notNull(),
    bodyMd: text("body_md").notNull().default(""),
    icon: text("icon"),
    mediaId: bigint("media_id", { mode: "number" }).references(() => mediaAssets.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    check("project_operations_audience_check", sql`${t.audience} in ('visitor','admin','system')`),
    check("project_operations_title_check", sql`char_length(${t.title}) <= 80`),
    index("project_operations_project_idx").on(t.projectId, t.audience, t.sortOrder),
  ],
);

export const certifications = pgTable(
  "certifications",
  {
    id: id(),
    title: text("title").notNull(),
    obtainedOn: date("obtained_on").notNull(),
    mediaId: bigint("media_id", { mode: "number" })
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("published"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("certifications_title_check", sql`char_length(${t.title}) between 1 and 120`),
    check("certifications_status_check", sql`${t.status} in ('draft','published','archived')`),
    index("certifications_status_idx").on(t.status, t.obtainedOn.desc()),
  ],
);

// ── Messages ────────────────────────────────────────────────────────
export const contactMessages = pgTable(
  "contact_messages",
  {
    id: id(),
    createdAt: createdAt(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("unread"),
    starred: boolean("starred").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    trashedAt: timestamp("trashed_at", { withTimezone: true }),
    pagePath: text("page_path"),
    referrerHost: text("referrer_host"),
    country: text("country"),
    deviceType: text("device_type"),
    browser: text("browser"),
    spamScore: integer("spam_score").notNull().default(0),
  },
  (t) => [
    check("contact_messages_name_check", sql`char_length(${t.name}) between 1 and 100`),
    check("contact_messages_email_check", sql`char_length(${t.email}) <= 254`),
    check("contact_messages_subject_check", sql`char_length(${t.subject}) between 3 and 150`),
    check("contact_messages_body_check", sql`char_length(${t.body}) between 10 and 5000`),
    check("contact_messages_status_check", sql`${t.status} in ('unread','read','archived','spam','trash')`),
    index("contact_messages_status_idx").on(t.status, t.createdAt.desc()),
  ],
);

// ── Analytics (kotoha-compatible + Moesoft fields) ──────────────────
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: id(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    eventType: text("event_type").notNull(),
    visitId: text("visit_id").notNull(),
    visitorHash: text("visitor_hash").notNull(),
    path: text("path"),
    section: text("section"),
    durationMs: integer("duration_ms"),
    contentType: text("content_type"),
    contentId: bigint("content_id", { mode: "number" }),
    target: text("target"),
    deviceType: text("device_type").notNull().default("unknown"),
    browser: text("browser"),
    os: text("os"),
    language: text("language"),
    country: text("country"),
    referrerHost: text("referrer_host"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    environment: text("environment").notNull().default("production"),
  },
  (t) => [
    check(
      "analytics_events_type_check",
      sql`${t.eventType} in ('page_view','page_dwell','section_dwell','loader_timing','project_view','project_open','project_link_click','video_play','video_complete','image_open','certificate_open','outbound_click','contact_start','contact_submit','copy_email','motion_toggle','filter_use','not_found')`,
    ),
    check("analytics_events_duration_check", sql`${t.durationMs} is null or ${t.durationMs} >= 0`),
    check("analytics_events_device_check", sql`${t.deviceType} in ('mobile','tablet','desktop','unknown')`),
    check("analytics_events_env_check", sql`${t.environment} in ('production','preview','development')`),
    index("analytics_events_time_idx").on(t.occurredAt),
    index("analytics_events_type_time_idx").on(t.eventType, t.occurredAt),
    index("analytics_events_content_idx").on(t.contentType, t.contentId, t.occurredAt),
  ],
);

export const analyticsDaily = pgTable(
  "analytics_daily",
  {
    day: date("day").notNull(),
    metric: text("metric").notNull(),
    dimension: text("dimension").notNull().default(""),
    value: bigint("value", { mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.metric, t.dimension] })],
);

export const analyticsSalts = pgTable("analytics_salts", {
  day: date("day").primaryKey(),
  salt: bytea("salt").notNull(),
});

