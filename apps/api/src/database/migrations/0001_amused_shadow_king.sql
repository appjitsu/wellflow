DO $$ BEGIN
 CREATE TYPE "public"."afe_type" AS ENUM('drilling', 'completion', 'workover', 'facility');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."afe_status" AS ENUM('draft', 'submitted', 'approved', 'rejected', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "afes" ALTER COLUMN "afe_type" SET DATA TYPE "public"."afe_type" USING "afe_type"::"public"."afe_type";--> statement-breakpoint
ALTER TABLE "afes" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "afes" ALTER COLUMN "status" SET DATA TYPE "public"."afe_status" USING "status"::"public"."afe_status";--> statement-breakpoint
ALTER TABLE "afes" ALTER COLUMN "status" SET DEFAULT 'draft';