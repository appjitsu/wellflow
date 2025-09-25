CREATE TYPE "public"."drilling_program_status" AS ENUM('draft', 'approved', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('preventive', 'inspection', 'repair');--> statement-breakpoint
CREATE TYPE "public"."workover_status" AS ENUM('planned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "curative_item_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curative_item_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"role" varchar(50) NOT NULL,
	"page_range" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_drilling_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"report_date" date NOT NULL,
	"depth_md" integer,
	"depth_tvd" integer,
	"rotating_hours" numeric(6, 2),
	"npt_hours" numeric(6, 2),
	"mud_properties" jsonb,
	"bit_performance" jsonb,
	"personnel" jsonb,
	"weather" jsonb,
	"hse_incidents" jsonb,
	"day_cost" numeric(12, 2),
	"next_operations" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drilling_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"afe_id" uuid,
	"program_name" varchar(255) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "drilling_program_status" DEFAULT 'draft' NOT NULL,
	"estimated_total_cost" jsonb,
	"actual_total_cost" jsonb,
	"casing_program" jsonb,
	"mud_program" jsonb,
	"bit_program" jsonb,
	"cement_program" jsonb,
	"directional_plan" jsonb,
	"formation_tops" jsonb,
	"hazard_analysis" jsonb,
	"risk_assessment" jsonb,
	"submitted_at" timestamp,
	"submitted_by_user_id" uuid,
	"approved_at" timestamp,
	"approved_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"vendor_id" uuid,
	"maintenance_type" "maintenance_type" DEFAULT 'preventive' NOT NULL,
	"schedule_date" date,
	"work_order_number" varchar(100),
	"status" "maintenance_status" DEFAULT 'scheduled' NOT NULL,
	"estimated_cost" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"downtime_hours" numeric(6, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workovers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"afe_id" uuid,
	"reason" varchar(255),
	"status" "workover_status" DEFAULT 'planned' NOT NULL,
	"start_date" date,
	"end_date" date,
	"work_performed" text,
	"estimated_cost" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"pre_production" jsonb,
	"post_production" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "tx_rrc_operator_number" varchar(20);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "tx_rrc_agent_id" varchar(50);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "regulatory_contact_name" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "regulatory_contact_email" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "regulatory_contact_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "curative_item_documents" ADD CONSTRAINT "curative_item_documents_curative_item_id_curative_items_id_fk" FOREIGN KEY ("curative_item_id") REFERENCES "public"."curative_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curative_item_documents" ADD CONSTRAINT "curative_item_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_drilling_reports" ADD CONSTRAINT "daily_drilling_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_drilling_reports" ADD CONSTRAINT "daily_drilling_reports_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drilling_programs" ADD CONSTRAINT "drilling_programs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drilling_programs" ADD CONSTRAINT "drilling_programs_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drilling_programs" ADD CONSTRAINT "drilling_programs_afe_id_afes_id_fk" FOREIGN KEY ("afe_id") REFERENCES "public"."afes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drilling_programs" ADD CONSTRAINT "drilling_programs_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drilling_programs" ADD CONSTRAINT "drilling_programs_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workovers" ADD CONSTRAINT "workovers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workovers" ADD CONSTRAINT "workovers_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workovers" ADD CONSTRAINT "workovers_afe_id_afes_id_fk" FOREIGN KEY ("afe_id") REFERENCES "public"."afes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "curative_item_documents_unique" ON "curative_item_documents" USING btree ("curative_item_id","document_id");--> statement-breakpoint
CREATE INDEX "curative_item_documents_curative_item_id_idx" ON "curative_item_documents" USING btree ("curative_item_id");--> statement-breakpoint
CREATE INDEX "curative_item_documents_document_id_idx" ON "curative_item_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "curative_item_documents_role_idx" ON "curative_item_documents" USING btree ("role");--> statement-breakpoint
CREATE INDEX "ddr_org_idx" ON "daily_drilling_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ddr_well_idx" ON "daily_drilling_reports" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "ddr_date_idx" ON "daily_drilling_reports" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "ddr_well_date_idx" ON "daily_drilling_reports" USING btree ("well_id","report_date");--> statement-breakpoint
CREATE INDEX "drilling_programs_org_idx" ON "drilling_programs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "drilling_programs_well_idx" ON "drilling_programs" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "drilling_programs_afe_idx" ON "drilling_programs" USING btree ("afe_id");--> statement-breakpoint
CREATE INDEX "drilling_programs_status_idx" ON "drilling_programs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maintenance_org_idx" ON "maintenance_schedules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "maintenance_equipment_idx" ON "maintenance_schedules" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "maintenance_vendor_idx" ON "maintenance_schedules" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "maintenance_date_idx" ON "maintenance_schedules" USING btree ("schedule_date");--> statement-breakpoint
CREATE INDEX "maintenance_status_idx" ON "maintenance_schedules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workovers_org_idx" ON "workovers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workovers_well_idx" ON "workovers" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "workovers_afe_idx" ON "workovers" USING btree ("afe_id");--> statement-breakpoint
CREATE INDEX "workovers_status_idx" ON "workovers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workovers_dates_idx" ON "workovers" USING btree ("start_date","end_date");