CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"organization_id" uuid,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"request_id" uuid,
	"endpoint" text,
	"method" text,
	"duration" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "cash_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lease_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"billing_month" date NOT NULL,
	"due_date" date,
	"amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"type" varchar(20) DEFAULT 'MONTHLY' NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"interest_rate_percent" numeric(5, 2) DEFAULT '0',
	"consent_required" boolean DEFAULT false NOT NULL,
	"consent_status" varchar(20) DEFAULT 'NOT_REQUIRED' NOT NULL,
	"consent_received_at" timestamp,
	"approved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "joint_operating_agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agreement_number" varchar(100) NOT NULL,
	"effective_date" date NOT NULL,
	"end_date" date,
	"operator_overhead_percent" numeric(5, 2) DEFAULT '0',
	"voting_threshold_percent" numeric(5, 2) DEFAULT '50.0',
	"non_consent_penalty_percent" numeric(5, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"terms" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "joa_org_agreement_unique" UNIQUE("organization_id","agreement_number")
);
--> statement-breakpoint
CREATE TABLE "owner_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"revenue_distribution_id" uuid NOT NULL,
	"payment_date" date,
	"payment_method" varchar(20) DEFAULT 'CHECK' NOT NULL,
	"check_number" varchar(50),
	"ach_trace_number" varchar(50),
	"gross_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"deductions" numeric(15, 2) DEFAULT '0' NOT NULL,
	"tax_withholding" numeric(15, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jib_statements" ADD COLUMN "previous_balance" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD COLUMN "current_balance" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD COLUMN "cash_call_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_calls" ADD CONSTRAINT "cash_calls_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_calls" ADD CONSTRAINT "cash_calls_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_calls" ADD CONSTRAINT "cash_calls_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "joint_operating_agreements" ADD CONSTRAINT "joint_operating_agreements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_payments" ADD CONSTRAINT "owner_payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_payments" ADD CONSTRAINT "owner_payments_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_payments" ADD CONSTRAINT "owner_payments_revenue_distribution_id_revenue_distributions_id_fk" FOREIGN KEY ("revenue_distribution_id") REFERENCES "public"."revenue_distributions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_organization_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "audit_logs_request_idx" ON "audit_logs" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "audit_logs_success_idx" ON "audit_logs" USING btree ("success");--> statement-breakpoint
CREATE INDEX "cash_calls_org_idx" ON "cash_calls" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cash_calls_lease_idx" ON "cash_calls" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "cash_calls_partner_idx" ON "cash_calls" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "cash_calls_month_idx" ON "cash_calls" USING btree ("billing_month");--> statement-breakpoint
CREATE INDEX "cash_calls_status_idx" ON "cash_calls" USING btree ("status");--> statement-breakpoint
CREATE INDEX "joa_org_idx" ON "joint_operating_agreements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "joa_status_idx" ON "joint_operating_agreements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "owner_payments_org_idx" ON "owner_payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "owner_payments_partner_idx" ON "owner_payments" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "owner_payments_rd_idx" ON "owner_payments" USING btree ("revenue_distribution_id");--> statement-breakpoint
CREATE INDEX "owner_payments_status_idx" ON "owner_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "owner_payments_date_idx" ON "owner_payments" USING btree ("payment_date");--> statement-breakpoint
ALTER TABLE "jib_statements" ADD CONSTRAINT "jib_statements_cash_call_id_cash_calls_id_fk" FOREIGN KEY ("cash_call_id") REFERENCES "public"."cash_calls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "jib_statements_due_date_idx" ON "jib_statements" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "jib_statements_cash_call_idx" ON "jib_statements" USING btree ("cash_call_id");