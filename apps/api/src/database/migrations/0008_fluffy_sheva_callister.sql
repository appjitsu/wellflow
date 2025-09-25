CREATE TYPE "public"."contact_type" AS ENUM('primary', 'billing', 'technical', 'safety', 'emergency', 'management', 'operations');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'pending_approval', 'active', 'expired', 'terminated', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('service_agreement', 'master_service_agreement', 'purchase_order', 'blanket_order', 'frame_agreement', 'consulting_agreement');--> statement-breakpoint
CREATE TYPE "public"."vendor_rating" AS ENUM('not_rated', 'excellent', 'good', 'satisfactory', 'poor', 'unacceptable');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('pending', 'approved', 'rejected', 'suspended', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."vendor_type" AS ENUM('service', 'supplier', 'contractor', 'consultant', 'transportation', 'maintenance', 'environmental', 'laboratory');--> statement-breakpoint
CREATE TABLE "chain_of_title_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lease_id" uuid NOT NULL,
	"instrument_type" varchar(50) NOT NULL,
	"instrument_date" date NOT NULL,
	"recording_info" jsonb,
	"grantor" text NOT NULL,
	"grantee" text NOT NULL,
	"legal_description_ref" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curative_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curative_item_id" uuid NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"action_by" varchar(255),
	"action_date" timestamp DEFAULT now() NOT NULL,
	"details" text,
	"previous_status" varchar(20),
	"new_status" varchar(20),
	"due_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "title_opinion_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_opinion_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"role" varchar(50) NOT NULL,
	"page_range" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"contract_number" varchar(100) NOT NULL,
	"contract_type" "contract_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"effective_date" date NOT NULL,
	"expiration_date" date NOT NULL,
	"signed_date" date,
	"contract_value" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"payment_terms" varchar(100),
	"rate_schedule" jsonb,
	"service_level" jsonb,
	"performance_metrics" jsonb,
	"insurance_requirements" jsonb,
	"compliance_requirements" jsonb,
	"termination_clause" text,
	"renewal_terms" jsonb,
	"penalty_clause" text,
	"approved_by" uuid,
	"approval_date" timestamp,
	"approval_notes" text,
	"document_path" varchar(500),
	"attachments" jsonb,
	"performance_score" numeric(3, 2),
	"last_performance_review" timestamp,
	"auto_renewal" boolean DEFAULT false NOT NULL,
	"renewal_notice_date" date,
	"renewal_notice_sent" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_performance_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"contract_id" uuid,
	"review_period_start" date NOT NULL,
	"review_period_end" date NOT NULL,
	"review_date" timestamp NOT NULL,
	"reviewed_by" uuid NOT NULL,
	"reviewer_name" varchar(255) NOT NULL,
	"reviewer_title" varchar(100),
	"overall_rating" numeric(2, 1) NOT NULL,
	"safety_rating" numeric(2, 1) NOT NULL,
	"quality_rating" numeric(2, 1) NOT NULL,
	"timeliness_rating" numeric(2, 1) NOT NULL,
	"cost_effectiveness_rating" numeric(2, 1) NOT NULL,
	"communication_rating" numeric(2, 1) NOT NULL,
	"jobs_completed" integer DEFAULT 0 NOT NULL,
	"jobs_on_time" integer DEFAULT 0 NOT NULL,
	"safety_incidents" integer DEFAULT 0 NOT NULL,
	"quality_issues" integer DEFAULT 0 NOT NULL,
	"cost_variance" numeric(5, 2),
	"strengths" text,
	"areas_for_improvement" text,
	"specific_feedback" text,
	"recommended_actions" text,
	"recommend_for_renewal" boolean NOT NULL,
	"recommendation_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_qualifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"qualification_type" varchar(100) NOT NULL,
	"qualification_name" varchar(255) NOT NULL,
	"issuing_body" varchar(255) NOT NULL,
	"qualification_number" varchar(100),
	"issue_date" date NOT NULL,
	"expiration_date" date,
	"last_verified_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"document_path" varchar(500),
	"verification_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wells" DROP CONSTRAINT "wells_api_number_format_check";--> statement-breakpoint
ALTER TABLE "vendors" ALTER COLUMN "vendor_type" SET DATA TYPE "public"."vendor_type" USING "vendor_type"::"public"."vendor_type";--> statement-breakpoint
ALTER TABLE "afes" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "afes" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD COLUMN "department" varchar(100);--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD COLUMN "contact_type" "contact_type" DEFAULT 'primary' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD COLUMN "fax" varchar(20);--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD COLUMN "preferred_contact_method" varchar(20) DEFAULT 'email';--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD COLUMN "time_zone" varchar(50);--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD COLUMN "available_hours" varchar(100);--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD COLUMN "is_emergency_contact" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD COLUMN "emergency_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "status" "vendor_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "service_address" jsonb;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "credit_limit" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "insurance" jsonb;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "certifications" jsonb;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "is_prequalified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "prequalification_date" timestamp;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "qualification_expiry_date" timestamp;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "overall_rating" "vendor_rating" DEFAULT 'not_rated' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "safety_rating" "vendor_rating" DEFAULT 'not_rated' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "quality_rating" "vendor_rating" DEFAULT 'not_rated' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "timeliness_rating" "vendor_rating" DEFAULT 'not_rated' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "cost_effectiveness_rating" "vendor_rating" DEFAULT 'not_rated' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "total_jobs_completed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "average_job_value" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "incident_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "last_evaluation_date" timestamp;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "service_categories" jsonb;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "capabilities" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "primary_contact_id" uuid;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "website" varchar(255);--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "chain_of_title_entries" ADD CONSTRAINT "chain_of_title_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chain_of_title_entries" ADD CONSTRAINT "chain_of_title_entries_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curative_activities" ADD CONSTRAINT "curative_activities_curative_item_id_curative_items_id_fk" FOREIGN KEY ("curative_item_id") REFERENCES "public"."curative_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_opinion_documents" ADD CONSTRAINT "title_opinion_documents_title_opinion_id_title_opinions_id_fk" FOREIGN KEY ("title_opinion_id") REFERENCES "public"."title_opinions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_opinion_documents" ADD CONSTRAINT "title_opinion_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_contracts" ADD CONSTRAINT "vendor_contracts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_contracts" ADD CONSTRAINT "vendor_contracts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_performance_reviews" ADD CONSTRAINT "vendor_performance_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_performance_reviews" ADD CONSTRAINT "vendor_performance_reviews_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_performance_reviews" ADD CONSTRAINT "vendor_performance_reviews_contract_id_vendor_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."vendor_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_qualifications" ADD CONSTRAINT "vendor_qualifications_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chain_of_title_organization_id_idx" ON "chain_of_title_entries" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "chain_of_title_lease_id_idx" ON "chain_of_title_entries" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "chain_of_title_instrument_type_idx" ON "chain_of_title_entries" USING btree ("instrument_type");--> statement-breakpoint
CREATE INDEX "chain_of_title_instrument_date_idx" ON "chain_of_title_entries" USING btree ("instrument_date");--> statement-breakpoint
CREATE INDEX "curative_activities_curative_item_id_idx" ON "curative_activities" USING btree ("curative_item_id");--> statement-breakpoint
CREATE INDEX "curative_activities_action_type_idx" ON "curative_activities" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "curative_activities_action_date_idx" ON "curative_activities" USING btree ("action_date");--> statement-breakpoint
CREATE UNIQUE INDEX "title_opinion_documents_unique" ON "title_opinion_documents" USING btree ("title_opinion_id","document_id");--> statement-breakpoint
CREATE INDEX "title_opinion_documents_title_opinion_id_idx" ON "title_opinion_documents" USING btree ("title_opinion_id");--> statement-breakpoint
CREATE INDEX "title_opinion_documents_document_id_idx" ON "title_opinion_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "title_opinion_documents_role_idx" ON "title_opinion_documents" USING btree ("role");--> statement-breakpoint
CREATE INDEX "vendor_contracts_organization_id_idx" ON "vendor_contracts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendor_contracts_vendor_id_idx" ON "vendor_contracts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_contracts_status_idx" ON "vendor_contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendor_contracts_contract_type_idx" ON "vendor_contracts" USING btree ("contract_type");--> statement-breakpoint
CREATE INDEX "vendor_contracts_effective_date_idx" ON "vendor_contracts" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "vendor_contracts_expiration_date_idx" ON "vendor_contracts" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "vendor_contracts_renewal_notice_date_idx" ON "vendor_contracts" USING btree ("renewal_notice_date");--> statement-breakpoint
CREATE INDEX "vendor_contracts_is_active_idx" ON "vendor_contracts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "vendor_performance_reviews_organization_id_idx" ON "vendor_performance_reviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendor_performance_reviews_vendor_id_idx" ON "vendor_performance_reviews" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_performance_reviews_contract_id_idx" ON "vendor_performance_reviews" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "vendor_performance_reviews_review_date_idx" ON "vendor_performance_reviews" USING btree ("review_date");--> statement-breakpoint
CREATE INDEX "vendor_performance_reviews_period_idx" ON "vendor_performance_reviews" USING btree ("review_period_start","review_period_end");--> statement-breakpoint
CREATE INDEX "vendor_performance_reviews_overall_rating_idx" ON "vendor_performance_reviews" USING btree ("overall_rating");--> statement-breakpoint
CREATE INDEX "vendor_qualifications_vendor_id_idx" ON "vendor_qualifications" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_qualifications_type_idx" ON "vendor_qualifications" USING btree ("qualification_type");--> statement-breakpoint
CREATE INDEX "vendor_qualifications_expiration_date_idx" ON "vendor_qualifications" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "vendor_qualifications_is_active_idx" ON "vendor_qualifications" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "vendor_qualifications_is_verified_idx" ON "vendor_qualifications" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "vendor_contacts_contact_type_idx" ON "vendor_contacts" USING btree ("contact_type");--> statement-breakpoint
CREATE INDEX "vendor_contacts_is_emergency_idx" ON "vendor_contacts" USING btree ("is_emergency_contact");--> statement-breakpoint
CREATE INDEX "vendor_contacts_is_active_idx" ON "vendor_contacts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "vendors_status_idx" ON "vendors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendors_is_prequalified_idx" ON "vendors" USING btree ("is_prequalified");--> statement-breakpoint
CREATE INDEX "vendors_overall_rating_idx" ON "vendors" USING btree ("overall_rating");--> statement-breakpoint
CREATE INDEX "vendors_qualification_expiry_idx" ON "vendors" USING btree ("qualification_expiry_date");--> statement-breakpoint
CREATE INDEX "vendors_last_evaluation_idx" ON "vendors" USING btree ("last_evaluation_date");--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "api_format" CHECK (LENGTH(api_number) = 14 AND api_number ~ '^[0-9]+$');