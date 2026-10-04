CREATE TABLE "activity_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activity_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"admin_user_id" bigint,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" bigint,
	"summary" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"admin_user_id" bigint NOT NULL,
	"token_hash" text NOT NULL,
	"restricted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"user_agent" text,
	CONSTRAINT "admin_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"password_changed_at" timestamp with time zone,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username"),
	CONSTRAINT "admin_users_username_check" CHECK ("admin_users"."username" ~ '^[a-z0-9_.-]{3,40}$'),
	CONSTRAINT "admin_users_failed_login_count_check" CHECK ("admin_users"."failed_login_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "analytics_daily" (
	"day" date NOT NULL,
	"metric" text NOT NULL,
	"dimension" text DEFAULT '' NOT NULL,
	"value" bigint NOT NULL,
	CONSTRAINT "analytics_daily_day_metric_dimension_pk" PRIMARY KEY("day","metric","dimension")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "analytics_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"visit_id" text NOT NULL,
	"visitor_hash" text NOT NULL,
	"path" text,
	"section" text,
	"duration_ms" integer,
	"content_type" text,
	"content_id" bigint,
	"target" text,
	"device_type" text DEFAULT 'unknown' NOT NULL,
	"browser" text,
	"os" text,
	"language" text,
	"country" text,
	"referrer_host" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"environment" text DEFAULT 'production' NOT NULL,
	CONSTRAINT "analytics_events_type_check" CHECK ("analytics_events"."event_type" in ('page_view','page_dwell','section_dwell','loader_timing','project_view','project_open','project_link_click','video_play','video_complete','image_open','certificate_open','outbound_click','contact_start','contact_submit','copy_email','motion_toggle','filter_use','not_found')),
	CONSTRAINT "analytics_events_duration_check" CHECK ("analytics_events"."duration_ms" is null or "analytics_events"."duration_ms" >= 0),
	CONSTRAINT "analytics_events_device_check" CHECK ("analytics_events"."device_type" in ('mobile','tablet','desktop','unknown')),
	CONSTRAINT "analytics_events_env_check" CHECK ("analytics_events"."environment" in ('production','preview','development'))
);
--> statement-breakpoint
CREATE TABLE "analytics_salts" (
	"day" date PRIMARY KEY NOT NULL,
	"salt" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "certifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"obtained_on" date NOT NULL,
	"media_id" bigint NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certifications_title_check" CHECK (char_length("certifications"."title") between 1 and 120),
	CONSTRAINT "certifications_status_check" CHECK ("certifications"."status" in ('draft','published','archived'))
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contact_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'unread' NOT NULL,
	"starred" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"replied_at" timestamp with time zone,
	"trashed_at" timestamp with time zone,
	"page_path" text,
	"referrer_host" text,
	"country" text,
	"device_type" text,
	"browser" text,
	"spam_score" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "contact_messages_name_check" CHECK (char_length("contact_messages"."name") between 1 and 100),
	CONSTRAINT "contact_messages_email_check" CHECK (char_length("contact_messages"."email") <= 254),
	CONSTRAINT "contact_messages_subject_check" CHECK (char_length("contact_messages"."subject") between 3 and 150),
	CONSTRAINT "contact_messages_body_check" CHECK (char_length("contact_messages"."body") between 10 and 5000),
	CONSTRAINT "contact_messages_status_check" CHECK ("contact_messages"."status" in ('unread','read','archived','spam','trash'))
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "login_attempts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" text NOT NULL,
	"username_attempted" text NOT NULL,
	"succeeded" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "media_assets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"project_id" bigint,
	"kind" text NOT NULL,
	"role" text DEFAULT 'gallery' NOT NULL,
	"public_id" text NOT NULL,
	"version" bigint NOT NULL,
	"format" text NOT NULL,
	"width" integer,
	"height" integer,
	"bytes" bigint,
	"duration_ms" integer,
	"frame" text DEFAULT 'auto' NOT NULL,
	"alt_text" text,
	"caption" text,
	"dominant_color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "media_assets_kind_check" CHECK ("media_assets"."kind" in ('image','video')),
	CONSTRAINT "media_assets_role_check" CHECK ("media_assets"."role" in ('gallery','cover','preview','hover','operation','og','certificate','site')),
	CONSTRAINT "media_assets_frame_check" CHECK ("media_assets"."frame" in ('auto','browser','phone','tablet','window','none'))
);
--> statement-breakpoint
CREATE TABLE "project_links" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "project_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"project_id" bigint NOT NULL,
	"kind" text NOT NULL,
	"label" text,
	"url" text NOT NULL,
	"note" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "project_links_kind_check" CHECK ("project_links"."kind" in ('live','apk','exe','msi','dmg','appimage','ios','play_store','app_store','docs','demo_video','paper','other')),
	CONSTRAINT "project_links_url_check" CHECK ("project_links"."url" ~ '^https://')
);
--> statement-breakpoint
CREATE TABLE "project_operations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "project_operations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"project_id" bigint NOT NULL,
	"audience" text DEFAULT 'visitor' NOT NULL,
	"title" text NOT NULL,
	"body_md" text DEFAULT '' NOT NULL,
	"icon" text,
	"media_id" bigint,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "project_operations_audience_check" CHECK ("project_operations"."audience" in ('visitor','admin','system')),
	CONSTRAINT "project_operations_title_check" CHECK (char_length("project_operations"."title") <= 80)
);
--> statement-breakpoint
CREATE TABLE "project_slug_history" (
	"old_slug" text PRIMARY KEY NOT NULL,
	"project_id" bigint NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_technologies" (
	"project_id" bigint NOT NULL,
	"technology_id" bigint NOT NULL,
	"usage_note" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "project_technologies_project_id_technology_id_pk" PRIMARY KEY("project_id","technology_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"tagline" text NOT NULL,
	"description_md" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"platforms" text[] DEFAULT '{}'::text[] NOT NULL,
	"lifecycle" text DEFAULT 'live' NOT NULL,
	"role" text,
	"started_on" date,
	"finished_on" date,
	"credits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"accent_color" text,
	"accent_color_2" text,
	"accent_strong" text,
	"accent_on" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"disclaimer_md" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug"),
	CONSTRAINT "projects_slug_check" CHECK ("projects"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length("projects"."slug") <= 60),
	CONSTRAINT "projects_title_check" CHECK (char_length("projects"."title") between 1 and 80),
	CONSTRAINT "projects_tagline_check" CHECK (char_length("projects"."tagline") between 10 and 160),
	CONSTRAINT "projects_category_check" CHECK ("projects"."category" in ('web','mobile','desktop','game','tool','research','concept','other')),
	CONSTRAINT "projects_lifecycle_check" CHECK ("projects"."lifecycle" in ('live','beta','in_development','completed','delivered','research','concept','archived')),
	CONSTRAINT "projects_status_check" CHECK ("projects"."status" in ('draft','published','archived')),
	CONSTRAINT "projects_accent_check" CHECK ("projects"."accent_color" is null or "projects"."accent_color" ~ '^#[0-9A-Fa-f]{6}$')
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"bucket" text NOT NULL,
	"key_hash" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_bucket_key_hash_window_start_pk" PRIMARY KEY("bucket","key_hash","window_start")
);
--> statement-breakpoint
CREATE TABLE "technologies" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "technologies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"icon_key" text,
	"color" text,
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technologies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "technologies_category_check" CHECK ("technologies"."category" in ('language','framework','library','runtime','database','cloud','service','tool','design','platform','other'))
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_operations" ADD CONSTRAINT "project_operations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_operations" ADD CONSTRAINT "project_operations_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_slug_history" ADD CONSTRAINT "project_slug_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_technology_id_technologies_id_fk" FOREIGN KEY ("technology_id") REFERENCES "public"."technologies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_time_idx" ON "activity_log" USING btree ("occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "admin_sessions_user_idx" ON "admin_sessions" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_expires_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "analytics_events_time_idx" ON "analytics_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_type_time_idx" ON "analytics_events" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_content_idx" ON "analytics_events" USING btree ("content_type","content_id","occurred_at");--> statement-breakpoint
CREATE INDEX "certifications_status_idx" ON "certifications" USING btree ("status","obtained_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "contact_messages_status_idx" ON "contact_messages" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "login_attempts_ip_idx" ON "login_attempts" USING btree ("ip_hash","attempted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "login_attempts_user_idx" ON "login_attempts" USING btree ("username_attempted","attempted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "media_assets_project_idx" ON "media_assets" USING btree ("project_id","role","sort_order");--> statement-breakpoint
CREATE INDEX "project_operations_project_idx" ON "project_operations" USING btree ("project_id","audience","sort_order");--> statement-breakpoint
CREATE INDEX "projects_status_published_idx" ON "projects" USING btree ("status","published_at" DESC NULLS LAST);