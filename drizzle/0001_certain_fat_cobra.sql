ALTER TABLE "posts" ADD COLUMN "excerpt" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;