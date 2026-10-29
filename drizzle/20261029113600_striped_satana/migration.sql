CREATE TABLE "Answer" (
	"answeredAt" timestamp(3) NOT NULL,
	"askedId" integer,
	"answers" jsonb NOT NULL,
	"userId" text,
	CONSTRAINT "Answer_pkey" PRIMARY KEY("userId","askedId")
);
--> statement-breakpoint
CREATE TABLE "Asked" (
	"id" serial PRIMARY KEY,
	"messageTs" text NOT NULL,
	"teamId" text NOT NULL,
	"timestamp" timestamp(3) NOT NULL,
	"questions" jsonb NOT NULL,
	"revealed" boolean NOT NULL,
	"nagged" boolean DEFAULT false NOT NULL,
	"skipped" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Team" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"active" boolean NOT NULL,
	"postDay" integer NOT NULL,
	"postHour" integer NOT NULL,
	"revealDay" integer NOT NULL,
	"revealHour" integer NOT NULL,
	"questions" jsonb NOT NULL,
	"assosiatedGroup" text,
	"frequency" integer DEFAULT 1 NOT NULL,
	"weekSkew" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Asked" ADD CONSTRAINT "Asked_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_askedId_fkey" FOREIGN KEY ("askedId") REFERENCES "Asked"("id") ON DELETE RESTRICT ON UPDATE CASCADE;