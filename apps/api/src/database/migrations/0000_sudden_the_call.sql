CREATE TABLE "compliance_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"state_jurisdiction" varchar(10) NOT NULL,
	"reporting_period_start" date NOT NULL,
	"reporting_period_end" date NOT NULL,
	"due_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"form_data" jsonb,
	"calculated_values" jsonb,
	"submission_reference" varchar(100),
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"lease_id" uuid,
	"well_id" uuid,
	"document_name" varchar(255) NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"metadata" jsonb,
	"expiration_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"well_id" uuid NOT NULL,
	"equipment_name" varchar(255) NOT NULL,
	"equipment_type" varchar(50) NOT NULL,
	"manufacturer" varchar(100),
	"model" varchar(100),
	"serial_number" varchar(100),
	"installation_date" date,
	"specifications" jsonb,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jib_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"lease_id" uuid NOT NULL,
	"statement_period_start" date NOT NULL,
	"statement_period_end" date NOT NULL,
	"gross_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"working_interest_share" numeric(12, 2) DEFAULT '0' NOT NULL,
	"royalty_share" numeric(12, 2) DEFAULT '0' NOT NULL,
	"line_items" jsonb,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lease_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lease_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"working_interest_percent" numeric(5, 4) NOT NULL,
	"royalty_interest_percent" numeric(5, 4) NOT NULL,
	"net_revenue_interest_percent" numeric(5, 4) NOT NULL,
	"effective_date" date NOT NULL,
	"end_date" date,
	"is_operator" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lease_name" varchar(255) NOT NULL,
	"lease_number" varchar(100),
	"legal_description" jsonb,
	"surface_location" jsonb,
	"lease_start_date" date,
	"lease_end_date" date,
	"total_acres" numeric(10, 4),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leases_org_lease_name_unique" UNIQUE("organization_id","lease_name")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"tax_id" varchar(50),
	"address" jsonb,
	"phone" varchar(20),
	"email" varchar(255),
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"partner_name" varchar(255) NOT NULL,
	"partner_code" varchar(50) NOT NULL,
	"tax_id" varchar(50),
	"billing_address" jsonb,
	"remit_address" jsonb,
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partners_org_partner_code_unique" UNIQUE("organization_id","partner_code")
);
--> statement-breakpoint
CREATE TABLE "production_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"well_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"production_date" date NOT NULL,
	"oil_volume" numeric(10, 2) DEFAULT '0' NOT NULL,
	"gas_volume" numeric(12, 2) DEFAULT '0' NOT NULL,
	"water_volume" numeric(10, 2) DEFAULT '0' NOT NULL,
	"oil_price" numeric(8, 4),
	"gas_price" numeric(8, 4),
	"equipment_readings" jsonb,
	"notes" text,
	"is_estimated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "production_records_well_date_unique" UNIQUE("well_id","production_date")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" varchar(20) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "well_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"well_id" uuid NOT NULL,
	"conducted_by_user_id" uuid NOT NULL,
	"test_date" date NOT NULL,
	"test_type" varchar(20) NOT NULL,
	"oil_rate" numeric(10, 2),
	"gas_rate" numeric(12, 2),
	"water_rate" numeric(10, 2),
	"flowing_pressure" numeric(8, 2),
	"static_pressure" numeric(8, 2),
	"test_conditions" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lease_id" uuid,
	"well_name" varchar(255) NOT NULL,
	"api_number" varchar(14) NOT NULL,
	"surface_location" jsonb,
	"bottom_hole_location" jsonb,
	"total_depth" numeric(8, 2),
	"spud_date" date,
	"completion_date" date,
	"status" varchar(20) DEFAULT 'drilling' NOT NULL,
	"well_configuration" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wells_api_number_unique" UNIQUE("api_number")
);
--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD CONSTRAINT "jib_statements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD CONSTRAINT "jib_statements_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD CONSTRAINT "jib_statements_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_partners" ADD CONSTRAINT "lease_partners_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_partners" ADD CONSTRAINT "lease_partners_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_records" ADD CONSTRAINT "production_records_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_records" ADD CONSTRAINT "production_records_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_conducted_by_user_id_users_id_fk" FOREIGN KEY ("conducted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "wells_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "wells_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "compliance_reports_organization_id_idx" ON "compliance_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "compliance_reports_created_by_idx" ON "compliance_reports" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "compliance_reports_report_type_idx" ON "compliance_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "compliance_reports_status_idx" ON "compliance_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_reports_due_date_idx" ON "compliance_reports" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "compliance_reports_period_idx" ON "compliance_reports" USING btree ("reporting_period_start","reporting_period_end");--> statement-breakpoint
CREATE INDEX "documents_organization_id_idx" ON "documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "documents_uploaded_by_idx" ON "documents" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "documents_lease_id_idx" ON "documents" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "documents_well_id_idx" ON "documents" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "documents_document_type_idx" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "documents_expiration_date_idx" ON "documents" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "equipment_well_id_idx" ON "equipment" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "equipment_equipment_type_idx" ON "equipment" USING btree ("equipment_type");--> statement-breakpoint
CREATE INDEX "equipment_status_idx" ON "equipment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "equipment_serial_number_idx" ON "equipment" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "jib_statements_organization_id_idx" ON "jib_statements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "jib_statements_partner_id_idx" ON "jib_statements" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "jib_statements_lease_id_idx" ON "jib_statements" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "jib_statements_status_idx" ON "jib_statements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jib_statements_period_idx" ON "jib_statements" USING btree ("statement_period_start","statement_period_end");--> statement-breakpoint
CREATE INDEX "jib_statements_partner_period_idx" ON "jib_statements" USING btree ("partner_id","statement_period_start");--> statement-breakpoint
CREATE INDEX "lease_partners_lease_partner_idx" ON "lease_partners" USING btree ("lease_id","partner_id");--> statement-breakpoint
CREATE INDEX "lease_partners_lease_id_idx" ON "lease_partners" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "lease_partners_partner_id_idx" ON "lease_partners" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "lease_partners_effective_date_idx" ON "lease_partners" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "leases_organization_id_idx" ON "leases" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "leases_status_idx" ON "leases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leases_end_date_idx" ON "leases" USING btree ("lease_end_date");--> statement-breakpoint
CREATE INDEX "partners_organization_id_idx" ON "partners" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "partners_is_active_idx" ON "partners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "production_records_well_id_idx" ON "production_records" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "production_records_date_idx" ON "production_records" USING btree ("production_date");--> statement-breakpoint
CREATE INDEX "production_records_created_by_idx" ON "production_records" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "users_organization_id_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "well_tests_well_id_idx" ON "well_tests" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "well_tests_conducted_by_idx" ON "well_tests" USING btree ("conducted_by_user_id");--> statement-breakpoint
CREATE INDEX "well_tests_test_date_idx" ON "well_tests" USING btree ("test_date");--> statement-breakpoint
CREATE INDEX "well_tests_test_type_idx" ON "well_tests" USING btree ("test_type");--> statement-breakpoint
CREATE INDEX "well_tests_well_date_idx" ON "well_tests" USING btree ("well_id","test_date");--> statement-breakpoint
CREATE INDEX "wells_organization_id_idx" ON "wells" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "wells_lease_id_idx" ON "wells" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "wells_status_idx" ON "wells" USING btree ("status");