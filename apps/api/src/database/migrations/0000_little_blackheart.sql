DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('owner', 'manager', 'pumper');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."well_type" AS ENUM('oil', 'gas', 'injection', 'disposal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."well_status" AS ENUM('active', 'inactive', 'plugged', 'drilling');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE "afe_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"afe_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"approval_status" varchar(20) NOT NULL,
	"approved_amount" numeric(12, 2),
	"approval_date" timestamp,
	"comments" text,
	"approved_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "afe_approvals_afe_partner_unique" UNIQUE("afe_id","partner_id")
);
--> statement-breakpoint
CREATE TABLE "afe_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"afe_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"description" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"estimated_cost" numeric(12, 2) NOT NULL,
	"actual_cost" numeric(12, 2),
	"vendor_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "afe_line_items_afe_line_unique" UNIQUE("afe_id","line_number")
);
--> statement-breakpoint
CREATE TABLE "afes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"afe_number" varchar(50) NOT NULL,
	"well_id" uuid,
	"lease_id" uuid,
	"afe_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_estimated_cost" numeric(12, 2),
	"approved_amount" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"effective_date" date,
	"approval_date" date,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "afes_org_afe_number_unique" UNIQUE("organization_id","afe_number")
);
--> statement-breakpoint
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
CREATE TABLE "compliance_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid,
	"compliance_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"regulatory_agency" varchar(50) NOT NULL,
	"due_date" date NOT NULL,
	"frequency" varchar(20),
	"next_due_date" date,
	"priority" varchar(10) DEFAULT 'medium' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"completion_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curative_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_opinion_id" uuid NOT NULL,
	"item_number" varchar(20) NOT NULL,
	"defect_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"priority" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"assigned_to" varchar(255),
	"due_date" date,
	"resolution_date" date,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "division_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"decimal_interest" numeric(10, 8) NOT NULL,
	"effective_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "division_orders_well_partner_unique" UNIQUE("well_id","partner_id","effective_date")
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
CREATE TABLE "environmental_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid,
	"reported_by_user_id" uuid NOT NULL,
	"incident_number" varchar(50) NOT NULL,
	"incident_type" varchar(50) NOT NULL,
	"incident_date" date NOT NULL,
	"discovery_date" date NOT NULL,
	"location" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"cause_analysis" text,
	"substance_involved" varchar(100),
	"estimated_volume" numeric(10, 2),
	"volume_unit" varchar(20),
	"severity" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"regulatory_notification" boolean DEFAULT false,
	"notification_date" date,
	"remediation_actions" jsonb,
	"closure_date" date,
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
CREATE TABLE "lease_operating_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lease_id" uuid NOT NULL,
	"statement_month" date NOT NULL,
	"total_expenses" numeric(12, 2),
	"operating_expenses" numeric(12, 2),
	"capital_expenses" numeric(12, 2),
	"expense_breakdown" jsonb,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"notes" text,
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
	"name" varchar(255) NOT NULL,
	"lease_number" varchar(100),
	"lessor" varchar(255) NOT NULL,
	"lessee" varchar(255) NOT NULL,
	"acreage" numeric(10, 4),
	"royalty_rate" numeric(5, 4),
	"effective_date" date,
	"expiration_date" date,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"legal_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"organization_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"production_date" date NOT NULL,
	"oil_volume" numeric(10, 2),
	"gas_volume" numeric(12, 2),
	"water_volume" numeric(10, 2),
	"oil_price" numeric(8, 4),
	"gas_price" numeric(8, 4),
	"run_ticket" varchar(100),
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "production_records_well_date_unique" UNIQUE("well_id","production_date")
);
--> statement-breakpoint
CREATE TABLE "regulatory_filings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid,
	"filed_by_user_id" uuid NOT NULL,
	"filing_type" varchar(50) NOT NULL,
	"regulatory_agency" varchar(50) NOT NULL,
	"filing_period" varchar(20) NOT NULL,
	"reporting_period_start" date NOT NULL,
	"reporting_period_end" date NOT NULL,
	"due_date" date NOT NULL,
	"submission_date" date,
	"confirmation_number" varchar(100),
	"filing_data" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_distributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"division_order_id" uuid NOT NULL,
	"production_month" date NOT NULL,
	"oil_volume" numeric(10, 2),
	"gas_volume" numeric(12, 2),
	"oil_revenue" numeric(12, 2),
	"gas_revenue" numeric(12, 2),
	"total_revenue" numeric(12, 2),
	"severance_tax" numeric(12, 2),
	"net_revenue" numeric(12, 2),
	"check_number" varchar(50),
	"payment_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spill_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"environmental_incident_id" uuid NOT NULL,
	"report_number" varchar(50) NOT NULL,
	"regulatory_agency" varchar(100) NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"submission_date" date NOT NULL,
	"spill_volume" numeric(10, 2) NOT NULL,
	"recovered_volume" numeric(10, 2),
	"affected_area" numeric(10, 2),
	"soil_contamination" varchar(20),
	"groundwater_impact" varchar(20),
	"wildlife_impact" varchar(20),
	"cleanup_actions" jsonb,
	"final_disposition" text,
	"report_status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "title_opinions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lease_id" uuid NOT NULL,
	"opinion_number" varchar(50) NOT NULL,
	"examiner_name" varchar(255) NOT NULL,
	"examination_date" date NOT NULL,
	"effective_date" date NOT NULL,
	"title_status" varchar(20) NOT NULL,
	"findings" text,
	"recommendations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" "user_role" NOT NULL,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"title" varchar(100),
	"email" varchar(255),
	"phone" varchar(20),
	"mobile" varchar(20),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"vendor_code" varchar(50) NOT NULL,
	"tax_id" varchar(50),
	"vendor_type" varchar(50) NOT NULL,
	"billing_address" jsonb,
	"payment_terms" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_org_vendor_code_unique" UNIQUE("organization_id","vendor_code")
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
	"api_number" varchar(14) NOT NULL,
	"well_name" varchar(255) NOT NULL,
	"well_number" varchar(50),
	"well_type" "well_type" NOT NULL,
	"status" "well_status" DEFAULT 'active' NOT NULL,
	"spud_date" date,
	"completion_date" date,
	"total_depth" numeric(8, 2),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"operator" varchar(255),
	"field" varchar(255),
	"formation" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wells_api_number_unique" UNIQUE("api_number")
);
--> statement-breakpoint
ALTER TABLE "afe_approvals" ADD CONSTRAINT "afe_approvals_afe_id_afes_id_fk" FOREIGN KEY ("afe_id") REFERENCES "public"."afes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afe_approvals" ADD CONSTRAINT "afe_approvals_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afe_approvals" ADD CONSTRAINT "afe_approvals_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afe_line_items" ADD CONSTRAINT "afe_line_items_afe_id_afes_id_fk" FOREIGN KEY ("afe_id") REFERENCES "public"."afes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afe_line_items" ADD CONSTRAINT "afe_line_items_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afes" ADD CONSTRAINT "afes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afes" ADD CONSTRAINT "afes_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afes" ADD CONSTRAINT "afes_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_schedules" ADD CONSTRAINT "compliance_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_schedules" ADD CONSTRAINT "compliance_schedules_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curative_items" ADD CONSTRAINT "curative_items_title_opinion_id_title_opinions_id_fk" FOREIGN KEY ("title_opinion_id") REFERENCES "public"."title_opinions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "division_orders" ADD CONSTRAINT "division_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "division_orders" ADD CONSTRAINT "division_orders_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "division_orders" ADD CONSTRAINT "division_orders_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environmental_incidents" ADD CONSTRAINT "environmental_incidents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environmental_incidents" ADD CONSTRAINT "environmental_incidents_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environmental_incidents" ADD CONSTRAINT "environmental_incidents_reported_by_user_id_users_id_fk" FOREIGN KEY ("reported_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD CONSTRAINT "jib_statements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD CONSTRAINT "jib_statements_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD CONSTRAINT "jib_statements_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_operating_statements" ADD CONSTRAINT "lease_operating_statements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_operating_statements" ADD CONSTRAINT "lease_operating_statements_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_partners" ADD CONSTRAINT "lease_partners_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_partners" ADD CONSTRAINT "lease_partners_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_records" ADD CONSTRAINT "production_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_records" ADD CONSTRAINT "production_records_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_filings" ADD CONSTRAINT "regulatory_filings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_filings" ADD CONSTRAINT "regulatory_filings_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_filings" ADD CONSTRAINT "regulatory_filings_filed_by_user_id_users_id_fk" FOREIGN KEY ("filed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD CONSTRAINT "revenue_distributions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD CONSTRAINT "revenue_distributions_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD CONSTRAINT "revenue_distributions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD CONSTRAINT "revenue_distributions_division_order_id_division_orders_id_fk" FOREIGN KEY ("division_order_id") REFERENCES "public"."division_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spill_reports" ADD CONSTRAINT "spill_reports_environmental_incident_id_environmental_incidents_id_fk" FOREIGN KEY ("environmental_incident_id") REFERENCES "public"."environmental_incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_opinions" ADD CONSTRAINT "title_opinions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_opinions" ADD CONSTRAINT "title_opinions_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_conducted_by_user_id_users_id_fk" FOREIGN KEY ("conducted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "wells_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "wells_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "afe_approvals_afe_id_idx" ON "afe_approvals" USING btree ("afe_id");--> statement-breakpoint
CREATE INDEX "afe_approvals_partner_id_idx" ON "afe_approvals" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "afe_approvals_approval_status_idx" ON "afe_approvals" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "afe_line_items_afe_id_idx" ON "afe_line_items" USING btree ("afe_id");--> statement-breakpoint
CREATE INDEX "afe_line_items_category_idx" ON "afe_line_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "afe_line_items_vendor_id_idx" ON "afe_line_items" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "afes_organization_id_idx" ON "afes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "afes_afe_number_idx" ON "afes" USING btree ("afe_number");--> statement-breakpoint
CREATE INDEX "afes_well_id_idx" ON "afes" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "afes_lease_id_idx" ON "afes" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "afes_status_idx" ON "afes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "afes_afe_type_idx" ON "afes" USING btree ("afe_type");--> statement-breakpoint
CREATE INDEX "compliance_reports_organization_id_idx" ON "compliance_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "compliance_reports_created_by_idx" ON "compliance_reports" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "compliance_reports_report_type_idx" ON "compliance_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "compliance_reports_status_idx" ON "compliance_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_reports_due_date_idx" ON "compliance_reports" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "compliance_reports_period_idx" ON "compliance_reports" USING btree ("reporting_period_start","reporting_period_end");--> statement-breakpoint
CREATE INDEX "compliance_schedules_organization_id_idx" ON "compliance_schedules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "compliance_schedules_well_id_idx" ON "compliance_schedules" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "compliance_schedules_compliance_type_idx" ON "compliance_schedules" USING btree ("compliance_type");--> statement-breakpoint
CREATE INDEX "compliance_schedules_due_date_idx" ON "compliance_schedules" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "compliance_schedules_status_idx" ON "compliance_schedules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_schedules_priority_idx" ON "compliance_schedules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "compliance_schedules_is_recurring_idx" ON "compliance_schedules" USING btree ("is_recurring");--> statement-breakpoint
CREATE INDEX "curative_items_title_opinion_id_idx" ON "curative_items" USING btree ("title_opinion_id");--> statement-breakpoint
CREATE INDEX "curative_items_defect_type_idx" ON "curative_items" USING btree ("defect_type");--> statement-breakpoint
CREATE INDEX "curative_items_priority_idx" ON "curative_items" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "curative_items_status_idx" ON "curative_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "curative_items_due_date_idx" ON "curative_items" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "division_orders_organization_id_idx" ON "division_orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "division_orders_well_id_idx" ON "division_orders" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "division_orders_partner_id_idx" ON "division_orders" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "division_orders_effective_date_idx" ON "division_orders" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "documents_organization_id_idx" ON "documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "documents_uploaded_by_idx" ON "documents" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "documents_lease_id_idx" ON "documents" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "documents_well_id_idx" ON "documents" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "documents_document_type_idx" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "documents_expiration_date_idx" ON "documents" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "environmental_incidents_organization_id_idx" ON "environmental_incidents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "environmental_incidents_well_id_idx" ON "environmental_incidents" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "environmental_incidents_incident_number_idx" ON "environmental_incidents" USING btree ("incident_number");--> statement-breakpoint
CREATE INDEX "environmental_incidents_incident_type_idx" ON "environmental_incidents" USING btree ("incident_type");--> statement-breakpoint
CREATE INDEX "environmental_incidents_severity_idx" ON "environmental_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "environmental_incidents_status_idx" ON "environmental_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "environmental_incidents_incident_date_idx" ON "environmental_incidents" USING btree ("incident_date");--> statement-breakpoint
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
CREATE INDEX "lease_operating_statements_organization_id_idx" ON "lease_operating_statements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "lease_operating_statements_lease_id_idx" ON "lease_operating_statements" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "lease_operating_statements_statement_month_idx" ON "lease_operating_statements" USING btree ("statement_month");--> statement-breakpoint
CREATE INDEX "lease_operating_statements_status_idx" ON "lease_operating_statements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lease_partners_lease_partner_idx" ON "lease_partners" USING btree ("lease_id","partner_id");--> statement-breakpoint
CREATE INDEX "lease_partners_lease_id_idx" ON "lease_partners" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "lease_partners_partner_id_idx" ON "lease_partners" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "lease_partners_effective_date_idx" ON "lease_partners" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "leases_organization_id_idx" ON "leases" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "leases_lease_number_idx" ON "leases" USING btree ("lease_number");--> statement-breakpoint
CREATE INDEX "partners_organization_id_idx" ON "partners" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "partners_is_active_idx" ON "partners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "production_records_organization_id_idx" ON "production_records" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "production_records_well_id_idx" ON "production_records" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "production_records_production_date_idx" ON "production_records" USING btree ("production_date");--> statement-breakpoint
CREATE INDEX "regulatory_filings_organization_id_idx" ON "regulatory_filings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "regulatory_filings_well_id_idx" ON "regulatory_filings" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "regulatory_filings_filing_type_idx" ON "regulatory_filings" USING btree ("filing_type");--> statement-breakpoint
CREATE INDEX "regulatory_filings_regulatory_agency_idx" ON "regulatory_filings" USING btree ("regulatory_agency");--> statement-breakpoint
CREATE INDEX "regulatory_filings_status_idx" ON "regulatory_filings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "regulatory_filings_due_date_idx" ON "regulatory_filings" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "regulatory_filings_reporting_period_idx" ON "regulatory_filings" USING btree ("reporting_period_start","reporting_period_end");--> statement-breakpoint
CREATE INDEX "revenue_distributions_organization_id_idx" ON "revenue_distributions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "revenue_distributions_well_id_idx" ON "revenue_distributions" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "revenue_distributions_partner_id_idx" ON "revenue_distributions" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "revenue_distributions_production_month_idx" ON "revenue_distributions" USING btree ("production_month");--> statement-breakpoint
CREATE INDEX "revenue_distributions_payment_date_idx" ON "revenue_distributions" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "spill_reports_environmental_incident_id_idx" ON "spill_reports" USING btree ("environmental_incident_id");--> statement-breakpoint
CREATE INDEX "spill_reports_report_number_idx" ON "spill_reports" USING btree ("report_number");--> statement-breakpoint
CREATE INDEX "spill_reports_regulatory_agency_idx" ON "spill_reports" USING btree ("regulatory_agency");--> statement-breakpoint
CREATE INDEX "spill_reports_report_type_idx" ON "spill_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "spill_reports_report_status_idx" ON "spill_reports" USING btree ("report_status");--> statement-breakpoint
CREATE INDEX "spill_reports_submission_date_idx" ON "spill_reports" USING btree ("submission_date");--> statement-breakpoint
CREATE INDEX "title_opinions_organization_id_idx" ON "title_opinions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "title_opinions_lease_id_idx" ON "title_opinions" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "title_opinions_opinion_number_idx" ON "title_opinions" USING btree ("opinion_number");--> statement-breakpoint
CREATE INDEX "title_opinions_title_status_idx" ON "title_opinions" USING btree ("title_status");--> statement-breakpoint
CREATE INDEX "title_opinions_examination_date_idx" ON "title_opinions" USING btree ("examination_date");--> statement-breakpoint
CREATE INDEX "users_organization_id_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendor_contacts_vendor_id_idx" ON "vendor_contacts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_contacts_is_primary_idx" ON "vendor_contacts" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "vendor_contacts_email_idx" ON "vendor_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "vendors_organization_id_idx" ON "vendors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendors_vendor_type_idx" ON "vendors" USING btree ("vendor_type");--> statement-breakpoint
CREATE INDEX "vendors_is_active_idx" ON "vendors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "well_tests_well_id_idx" ON "well_tests" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "well_tests_conducted_by_idx" ON "well_tests" USING btree ("conducted_by_user_id");--> statement-breakpoint
CREATE INDEX "well_tests_test_date_idx" ON "well_tests" USING btree ("test_date");--> statement-breakpoint
CREATE INDEX "well_tests_test_type_idx" ON "well_tests" USING btree ("test_type");--> statement-breakpoint
CREATE INDEX "well_tests_well_date_idx" ON "well_tests" USING btree ("well_id","test_date");--> statement-breakpoint
CREATE INDEX "wells_organization_id_idx" ON "wells" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "wells_lease_id_idx" ON "wells" USING btree ("lease_id");