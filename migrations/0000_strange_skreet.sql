CREATE TABLE "games" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"season" integer NOT NULL,
	"week" integer NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"is_monday_night" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "picks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(191) NOT NULL,
	"game_id" varchar(64) NOT NULL,
	"pick" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_tiebreakers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(191) NOT NULL,
	"season" integer NOT NULL,
	"week" integer NOT NULL,
	"mnf_total_points_guess" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
