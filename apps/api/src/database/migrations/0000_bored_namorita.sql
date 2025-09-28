CREATE TYPE "public"."afe_status" AS ENUM('draft', 'submitted', 'approved', 'rejected', 'closed');--> statement-breakpoint
CREATE TYPE "public"."afe_type" AS ENUM('drilling', 'completion', 'workover', 'facility');--> statement-breakpoint
CREATE TYPE "public"."artificial_lift_method" AS ENUM('NATURAL_FLOW', 'ROD_PUMP', 'ESP', 'GAS_LIFT', 'PLUNGER_LIFT', 'HYDRAULIC_PUMP', 'PROGRESSING_CAVITY', 'JET_PUMP', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('primary', 'billing', 'technical', 'safety', 'emergency', 'management', 'operations');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'pending_approval', 'active', 'expired', 'terminated', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('service_agreement', 'master_service_agreement', 'purchase_order', 'blanket_order', 'frame_agreement', 'consulting_agreement');--> statement-breakpoint
CREATE TYPE "public"."decline_curve_method" AS ENUM('ARPS', 'DUONG', 'MODIFIED_ARPS', 'EXPONENTIAL', 'HARMONIC', 'HYPERBOLIC', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."drilling_program_status" AS ENUM('draft', 'approved', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."geological_data_source" AS ENUM('LOGGING', 'CORE', 'SEISMIC', 'PRESSURE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."geological_interpretation_status" AS ENUM('DRAFT', 'IN_PROGRESS', 'APPROVED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."geological_log_type" AS ENUM('GAMMA_RAY', 'RESISTIVITY', 'NEUTRON', 'DENSITY', 'SONIC', 'IMAGING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('preventive', 'inspection', 'repair');--> statement-breakpoint
CREATE TYPE "public"."production_data_source" AS ENUM('SCADA', 'MANUAL', 'ALLOCATED', 'SIMULATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."reserves_category" AS ENUM('PROVED_DEVELOPED_PRODUCING', 'PROVED_DEVELOPED_NON_PRODUCING', 'PROVED_UNDEVELOPED', 'PROBABLE', 'POSSIBLE');--> statement-breakpoint
CREATE TYPE "public"."reserves_classification" AS ENUM('SEC', 'PRMS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."reserves_validation_status" AS ENUM('REQUESTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."vendor_rating" AS ENUM('not_rated', 'excellent', 'good', 'satisfactory', 'poor', 'unacceptable');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('pending', 'approved', 'rejected', 'suspended', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."vendor_type" AS ENUM('service', 'supplier', 'contractor', 'consultant', 'transportation', 'maintenance', 'environmental', 'laboratory');--> statement-breakpoint
CREATE TYPE "public"."well_performance_status" AS ENUM('OPTIMAL', 'DECLINING', 'INTERVENTION_REQUIRED', 'SHUT_IN', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."well_test_method" AS ENUM('FLOWING', 'BUILDUP', 'DRAW_DOWN', 'MULTI_RATE', 'INTERFERENCE', 'PVT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."well_test_validation_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."workover_status" AS ENUM('planned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."well_type" AS ENUM('OIL', 'GAS', 'OIL_AND_GAS', 'INJECTION', 'DISPOSAL', 'WATER', 'OTHER', 'oil', 'gas', 'injection', 'disposal');--> statement-breakpoint
CREATE TYPE "public"."well_status" AS ENUM('active', 'inactive', 'plugged', 'drilling');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'manager', 'pumper');--> statement-breakpoint
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
	"afe_type" "afe_type" NOT NULL,
	"status" "afe_status" DEFAULT 'draft' NOT NULL,
	"total_estimated_cost" numeric(12, 2),
	"approved_amount" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"effective_date" date,
	"approval_date" date,
	"description" text,
	"submitted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "afes_org_afe_number_unique" UNIQUE("organization_id","afe_number")
);
--> statement-breakpoint
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
CREATE TABLE "decline_curves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"reserves_id" uuid,
	"analysis_date" date NOT NULL,
	"method" "decline_curve_method" DEFAULT 'ARPS' NOT NULL,
	"phase" varchar(16) DEFAULT 'OIL' NOT NULL,
	"initial_rate" numeric(14, 3),
	"decline_rate" numeric(10, 6),
	"decline_exponent" numeric(10, 6),
	"eur" numeric(18, 3),
	"cumulative_production_to_date" numeric(18, 3),
	"forecast_horizon_date" date,
	"model_parameters" text,
	"model_fit_metrics" text,
	"created_by_user_id" uuid,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decline_curves_positive_eur_check" CHECK (eur IS NULL OR eur >= 0)
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
CREATE TABLE "enhanced_production" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid,
	"production_record_id" uuid NOT NULL,
	"recorded_by_user_id" uuid,
	"measurement_timestamp" timestamp DEFAULT now() NOT NULL,
	"data_source" "production_data_source" DEFAULT 'SCADA' NOT NULL,
	"separator_pressure" numeric(10, 2),
	"wellhead_pressure" numeric(10, 2),
	"bottom_hole_pressure" numeric(10, 2),
	"tubing_pressure" numeric(10, 2),
	"casing_pressure" numeric(10, 2),
	"flowing_temperature" numeric(7, 2),
	"allocated_oil_volume" numeric(14, 3),
	"allocated_gas_volume" numeric(14, 3),
	"allocated_water_volume" numeric(14, 3),
	"allocation_confidence_percent" numeric(5, 2),
	"data_quality_score" numeric(5, 2),
	"allocation_details" jsonb,
	"analytics_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enhanced_production_positive_volumes_check" CHECK ((allocated_oil_volume IS NULL OR allocated_oil_volume >= 0)
          AND (allocated_gas_volume IS NULL OR allocated_gas_volume >= 0)
          AND (allocated_water_volume IS NULL OR allocated_water_volume >= 0)),
	CONSTRAINT "enhanced_production_percentage_bounds_check" CHECK ((allocation_confidence_percent IS NULL OR (allocation_confidence_percent >= 0 AND allocation_confidence_percent <= 100))
          AND (data_quality_score IS NULL OR (data_quality_score >= 0 AND data_quality_score <= 100)))
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
CREATE TABLE "environmental_monitoring" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid,
	"monitoring_point_id" varchar(100) NOT NULL,
	"monitoring_type" varchar(50) NOT NULL,
	"monitoring_category" varchar(50),
	"location" varchar(255),
	"facility_id" varchar(100),
	"equipment_id" varchar(100),
	"parameter" varchar(100) NOT NULL,
	"unit_of_measure" varchar(20) NOT NULL,
	"monitoring_date" timestamp NOT NULL,
	"measured_value" numeric(15, 6),
	"detection_limit" numeric(15, 6),
	"exceedance_threshold" numeric(15, 6),
	"regulatory_standard" varchar(100),
	"compliance_limit" numeric(15, 6),
	"is_compliant" boolean,
	"monitoring_method" varchar(100),
	"equipment_type" varchar(100),
	"equipment_serial_number" varchar(100),
	"calibration_date" date,
	"next_calibration_date" date,
	"qa_qc_performed" boolean DEFAULT false,
	"qa_qc_method" varchar(100),
	"data_quality_indicator" varchar(10),
	"weather_conditions" jsonb,
	"operational_conditions" jsonb,
	"report_required" boolean DEFAULT false,
	"reporting_period" varchar(20),
	"due_date" date,
	"reported_date" date,
	"report_number" varchar(100),
	"corrective_actions" jsonb,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" date,
	"monitored_by_user_id" uuid NOT NULL,
	"reviewed_by_user_id" uuid,
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
CREATE TABLE "formation_tops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"geological_data_id" uuid,
	"formation_name" varchar(255) NOT NULL,
	"geological_marker" varchar(255),
	"top_depth" numeric(10, 2) NOT NULL,
	"bottom_depth" numeric(10, 2),
	"pick_method" varchar(100),
	"hydrocarbon_shows" text,
	"pick_date" date,
	"correlation_confidence" numeric(5, 2),
	"net_pay" numeric(8, 2),
	"gross_thickness" numeric(8, 2),
	"reservoir_quality" varchar(100),
	"fluid_contacts" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "formation_tops_depth_positive_check" CHECK (top_depth >= 0 AND (bottom_depth IS NULL OR bottom_depth >= 0)),
	CONSTRAINT "formation_tops_depth_ordering_check" CHECK (bottom_depth IS NULL OR top_depth <= bottom_depth),
	CONSTRAINT "formation_tops_correlation_range_check" CHECK (correlation_confidence IS NULL OR (correlation_confidence >= 0 AND correlation_confidence <= 100))
);
--> statement-breakpoint
CREATE TABLE "geological_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "geological_interpretation_status" DEFAULT 'DRAFT' NOT NULL,
	"data_source" "geological_data_source" DEFAULT 'LOGGING' NOT NULL,
	"log_type" "geological_log_type",
	"formation" varchar(255),
	"geological_marker" varchar(255),
	"top_measured_depth" numeric(10, 2),
	"top_true_vertical_depth" numeric(10, 2),
	"base_measured_depth" numeric(10, 2),
	"base_true_vertical_depth" numeric(10, 2),
	"net_pay" numeric(8, 2),
	"porosity_percent" numeric(5, 2),
	"permeability_millidarcies" numeric(10, 3),
	"water_saturation_percent" numeric(5, 2),
	"hydrocarbon_shows" text,
	"reservoir_quality" varchar(100),
	"pressure_gradient" numeric(8, 3),
	"temperature_gradient" numeric(8, 3),
	"interpretation_date" date,
	"created_by_user_id" uuid NOT NULL,
	"interpreted_by_user_id" uuid,
	"summary" text,
	"log_data" jsonb,
	"core_analysis" jsonb,
	"structural_model" jsonb,
	"reservoir_properties" jsonb,
	"attachments" jsonb,
	"change_comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "geological_data_version_positive_check" CHECK (version > 0),
	CONSTRAINT "geological_data_depth_ordering_check" CHECK (
        (top_measured_depth IS NULL OR base_measured_depth IS NULL OR top_measured_depth <= base_measured_depth)
        AND (top_true_vertical_depth IS NULL OR base_true_vertical_depth IS NULL OR top_true_vertical_depth <= base_true_vertical_depth)
      ),
	CONSTRAINT "geological_data_porosity_range_check" CHECK (porosity_percent IS NULL OR (porosity_percent >= 0 AND porosity_percent <= 100)),
	CONSTRAINT "geological_data_saturation_range_check" CHECK (water_saturation_percent IS NULL OR (water_saturation_percent >= 0 AND water_saturation_percent <= 100))
);
--> statement-breakpoint
CREATE TABLE "hse_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid,
	"incident_number" varchar(50) NOT NULL,
	"incident_type" varchar(50) NOT NULL,
	"severity" varchar(10) NOT NULL,
	"incident_date" timestamp NOT NULL,
	"discovery_date" timestamp,
	"location" varchar(255) NOT NULL,
	"facility_id" varchar(100),
	"description" text NOT NULL,
	"reported_by_user_id" uuid NOT NULL,
	"affected_personnel" jsonb,
	"root_cause_analysis" jsonb,
	"contributing_factors" jsonb,
	"environmental_impact" jsonb,
	"property_damage" numeric(12, 2),
	"estimated_cost" numeric(12, 2),
	"reportable_agencies" jsonb,
	"regulatory_notification_required" boolean DEFAULT false,
	"notification_deadline" date,
	"investigation_status" varchar(20) DEFAULT 'open' NOT NULL,
	"investigation_lead_user_id" uuid,
	"investigation_start_date" date,
	"investigation_completion_date" date,
	"corrective_actions" jsonb,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"closure_date" date,
	"lessons_learned" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"response_type" varchar(50) NOT NULL,
	"initiated_date" timestamp NOT NULL,
	"completed_date" timestamp,
	"due_date" timestamp,
	"assigned_user_id" uuid NOT NULL,
	"team_members" jsonb,
	"resources_utilized" jsonb,
	"description" text NOT NULL,
	"procedures_followed" jsonb,
	"actions_taken" jsonb,
	"emergency_procedures" jsonb,
	"containment_achieved" boolean,
	"containment_date" timestamp,
	"agency_notified" varchar(100),
	"notification_method" varchar(50),
	"report_number" varchar(100),
	"notification_date" timestamp,
	"agency_response" text,
	"corrective_action_type" varchar(50),
	"effectiveness_rating" varchar(10),
	"verification_method" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approval_required" boolean DEFAULT false,
	"approved_by_user_id" uuid,
	"approval_date" timestamp,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" date,
	"lessons_learned" text,
	"preventive_measures" jsonb,
	"cost_incurred" numeric(12, 2),
	"cost_category" varchar(50),
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
	"previous_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"current_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"due_date" date,
	"cash_call_id" uuid,
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lease_partners_percentage_range_check" CHECK (working_interest_percent >= 0 AND working_interest_percent <= 1 AND
          royalty_interest_percent >= 0 AND royalty_interest_percent <= 1 AND
          net_revenue_interest_percent >= 0 AND net_revenue_interest_percent <= 1),
	CONSTRAINT "lease_partners_date_range_check" CHECK (end_date IS NULL OR effective_date <= end_date)
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leases_royalty_rate_range_check" CHECK (royalty_rate IS NULL OR (royalty_rate >= 0 AND royalty_rate <= 1)),
	CONSTRAINT "leases_acreage_positive_check" CHECK (acreage IS NULL OR acreage > 0),
	CONSTRAINT "leases_date_range_check" CHECK (expiration_date IS NULL OR effective_date IS NULL OR effective_date <= expiration_date)
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
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"tax_id" varchar(50),
	"address" jsonb,
	"phone" varchar(20),
	"email" varchar(255),
	"tx_rrc_operator_number" varchar(20),
	"tx_rrc_agent_id" varchar(50),
	"regulatory_contact_name" varchar(255),
	"regulatory_contact_email" varchar(255),
	"regulatory_contact_phone" varchar(20),
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"aggregate_type" varchar(100) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"event_type" varchar(150) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" varchar(2000),
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
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
CREATE TABLE "password_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permit_renewals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permit_id" uuid NOT NULL,
	"renewal_number" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"renewal_due_date" date NOT NULL,
	"renewal_submitted_date" date,
	"renewal_approval_date" date,
	"renewal_expiration_date" date,
	"renewal_fee_amount" numeric(12, 2),
	"renewal_bond_amount" numeric(12, 2),
	"compliance_verified_date" date,
	"conditions_met" boolean DEFAULT false,
	"agency_contact_date" date,
	"agency_response_date" date,
	"agency_comments" text,
	"notification_sent_date" date,
	"reminder_sent_date" date,
	"escalation_sent_date" date,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid,
	"permit_number" varchar(100) NOT NULL,
	"permit_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"issuing_agency" varchar(100) NOT NULL,
	"regulatory_authority" varchar(100),
	"application_date" date,
	"submitted_date" date,
	"approval_date" date,
	"expiration_date" date,
	"permit_conditions" jsonb,
	"compliance_requirements" jsonb,
	"fee_amount" numeric(12, 2),
	"bond_amount" numeric(12, 2),
	"bond_type" varchar(50),
	"location" varchar(255),
	"facility_id" varchar(100),
	"document_ids" jsonb,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_allocation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lease_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"allocation_period_start" timestamp DEFAULT now() NOT NULL,
	"allocation_period_end" timestamp NOT NULL,
	"allocation_method" varchar(100) NOT NULL,
	"allocation_factor" numeric(10, 4) NOT NULL,
	"allocated_oil_volume" numeric(14, 3),
	"allocated_gas_volume" numeric(14, 3),
	"allocated_water_volume" numeric(14, 3),
	"allocation_confidence_percent" numeric(5, 2),
	"measured_production" jsonb,
	"allocation_inputs" jsonb,
	"comments" text,
	"created_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "production_allocation_unique_period" UNIQUE("well_id","allocation_period_start","allocation_period_end"),
	CONSTRAINT "production_allocation_positive_volumes_check" CHECK ((allocated_oil_volume IS NULL OR allocated_oil_volume >= 0)
          AND (allocated_gas_volume IS NULL OR allocated_gas_volume >= 0)
          AND (allocated_water_volume IS NULL OR allocated_water_volume >= 0)),
	CONSTRAINT "production_allocation_factor_range_check" CHECK (allocation_factor >= 0 AND allocation_factor <= 1),
	CONSTRAINT "production_allocation_period_chronology_check" CHECK (allocation_period_end > allocation_period_start),
	CONSTRAINT "production_allocation_percentage_bounds_check" CHECK (allocation_confidence_percent IS NULL OR (allocation_confidence_percent >= 0 AND allocation_confidence_percent <= 100))
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
	CONSTRAINT "production_records_well_date_unique" UNIQUE("well_id","production_date"),
	CONSTRAINT "production_records_positive_volumes_check" CHECK ((oil_volume IS NULL OR oil_volume >= 0) AND
          (gas_volume IS NULL OR gas_volume >= 0) AND
          (water_volume IS NULL OR water_volume >= 0)),
	CONSTRAINT "production_records_positive_prices_check" CHECK ((oil_price IS NULL OR oil_price >= 0) AND
          (gas_price IS NULL OR gas_price >= 0))
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
CREATE TABLE "regulatory_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid,
	"report_type" varchar(50) NOT NULL,
	"report_sub_type" varchar(50),
	"regulatory_agency" varchar(50) NOT NULL,
	"reporting_period" varchar(20) NOT NULL,
	"reporting_period_start" date NOT NULL,
	"reporting_period_end" date NOT NULL,
	"due_date" date NOT NULL,
	"grace_period_end" date,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"priority" varchar(10) DEFAULT 'normal' NOT NULL,
	"generated_at" timestamp,
	"generated_by_user_id" uuid,
	"reviewed_at" timestamp,
	"reviewed_by_user_id" uuid,
	"submitted_at" timestamp,
	"submitted_by_user_id" uuid,
	"external_submission_id" varchar(100),
	"confirmation_number" varchar(100),
	"submission_method" varchar(20) DEFAULT 'electronic',
	"report_data" jsonb,
	"report_metadata" jsonb,
	"attachments" jsonb,
	"validation_status" varchar(20) DEFAULT 'pending',
	"validation_errors" jsonb,
	"compliance_status" varchar(20) DEFAULT 'unknown',
	"filing_fee" numeric(10, 2),
	"payment_status" varchar(20) DEFAULT 'not_required',
	"is_auto_generated" boolean DEFAULT false NOT NULL,
	"auto_submission_enabled" boolean DEFAULT false NOT NULL,
	"next_auto_generation" timestamp,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_retry_at" timestamp,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"permit_id" uuid,
	"incident_id" uuid,
	"environmental_monitoring_id" uuid,
	"waste_management_id" uuid
);
--> statement-breakpoint
CREATE TABLE "reserves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid,
	"lease_id" uuid,
	"field" varchar(255),
	"evaluator_partner_id" uuid,
	"category" "reserves_category" NOT NULL,
	"classification" "reserves_classification" DEFAULT 'SEC' NOT NULL,
	"evaluation_date" date NOT NULL,
	"net_oil_reserves" numeric(18, 2),
	"net_gas_reserves" numeric(18, 2),
	"net_ngl_reserves" numeric(18, 2),
	"net_oil_reserves_working_interest" numeric(18, 2),
	"net_gas_reserves_working_interest" numeric(18, 2),
	"net_ngl_reserves_working_interest" numeric(18, 2),
	"present_value_10" numeric(18, 2),
	"present_value_discount_rate" numeric(7, 4),
	"economic_limit_date" date,
	"price_deck" text,
	"operating_cost_assumptions" text,
	"capital_cost_assumptions" text,
	"working_interest_percent" numeric(6, 3),
	"net_revenue_interest_percent" numeric(6, 3),
	"recovery_factor_percent" numeric(6, 3),
	"comments" text,
	"economic_assumptions" jsonb,
	"forecast_scenarios" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reserves_positive_reserves_check" CHECK ((net_oil_reserves IS NULL OR net_oil_reserves >= 0)
          AND (net_gas_reserves IS NULL OR net_gas_reserves >= 0)
          AND (net_ngl_reserves IS NULL OR net_ngl_reserves >= 0)
          AND (net_oil_reserves_working_interest IS NULL OR net_oil_reserves_working_interest >= 0)
          AND (net_gas_reserves_working_interest IS NULL OR net_gas_reserves_working_interest >= 0)
          AND (net_ngl_reserves_working_interest IS NULL OR net_ngl_reserves_working_interest >= 0)),
	CONSTRAINT "reserves_interest_percentage_bounds_check" CHECK (
        (working_interest_percent IS NULL OR (working_interest_percent >= 0 AND working_interest_percent <= 100))
        AND (net_revenue_interest_percent IS NULL OR (net_revenue_interest_percent >= 0 AND net_revenue_interest_percent <= 100))
        AND (recovery_factor_percent IS NULL OR (recovery_factor_percent >= 0 AND recovery_factor_percent <= 100))
      ),
	CONSTRAINT "reserves_discount_rate_bounds_check" CHECK (present_value_discount_rate IS NULL OR (present_value_discount_rate >= 0 AND present_value_discount_rate <= 1))
);
--> statement-breakpoint
CREATE TABLE "reserves_validations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"reserves_id" uuid NOT NULL,
	"validator_partner_id" uuid,
	"requested_by_user_id" uuid NOT NULL,
	"reviewed_by_user_id" uuid,
	"status" "reserves_validation_status" DEFAULT 'REQUESTED' NOT NULL,
	"request_date" date NOT NULL,
	"review_date" date,
	"comments" text,
	"findings" text,
	"documents" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reserves_validations_review_after_request_check" CHECK (review_date IS NULL OR review_date >= request_date)
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
	"total_revenue" numeric(12, 2) NOT NULL,
	"severance_tax" numeric(12, 2),
	"ad_valorem" numeric(12, 2),
	"transportation_costs" numeric(12, 2),
	"processing_costs" numeric(12, 2),
	"other_deductions" numeric(12, 2),
	"net_revenue" numeric(12, 2) NOT NULL,
	"check_number" varchar(50),
	"payment_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "revenue_distributions_partner_well_month_unique" UNIQUE("partner_id","well_id","production_month")
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
	"password_hash" varchar(255),
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token" varchar(255),
	"email_verification_expires_at" timestamp,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"lockout_count" integer DEFAULT 0 NOT NULL,
	"password_reset_token" varchar(255),
	"password_reset_expires_at" timestamp,
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
	"department" varchar(100),
	"contact_type" "contact_type" DEFAULT 'primary' NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"mobile" varchar(20),
	"fax" varchar(20),
	"address" text,
	"preferred_contact_method" varchar(20) DEFAULT 'email',
	"time_zone" varchar(50),
	"available_hours" varchar(100),
	"is_emergency_contact" boolean DEFAULT false NOT NULL,
	"emergency_phone" varchar(20),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"vendor_code" varchar(50) NOT NULL,
	"tax_id" varchar(50),
	"vendor_type" "vendor_type" NOT NULL,
	"status" "vendor_status" DEFAULT 'pending' NOT NULL,
	"billing_address" jsonb,
	"service_address" jsonb,
	"payment_terms" varchar(50),
	"credit_limit" numeric(12, 2),
	"insurance" jsonb,
	"certifications" jsonb,
	"is_prequalified" boolean DEFAULT false NOT NULL,
	"prequalification_date" timestamp,
	"qualification_expiry_date" timestamp,
	"overall_rating" "vendor_rating" DEFAULT 'not_rated' NOT NULL,
	"safety_rating" "vendor_rating" DEFAULT 'not_rated' NOT NULL,
	"quality_rating" "vendor_rating" DEFAULT 'not_rated' NOT NULL,
	"timeliness_rating" "vendor_rating" DEFAULT 'not_rated' NOT NULL,
	"cost_effectiveness_rating" "vendor_rating" DEFAULT 'not_rated' NOT NULL,
	"total_jobs_completed" integer DEFAULT 0 NOT NULL,
	"average_job_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"incident_count" integer DEFAULT 0 NOT NULL,
	"last_evaluation_date" timestamp,
	"service_categories" jsonb,
	"capabilities" text,
	"primary_contact_id" uuid,
	"website" varchar(255),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "vendors_org_vendor_code_unique" UNIQUE("organization_id","vendor_code")
);
--> statement-breakpoint
CREATE TABLE "waste_management" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid,
	"waste_manifest_id" varchar(100) NOT NULL,
	"waste_type" varchar(50) NOT NULL,
	"waste_category" varchar(50),
	"description" text NOT NULL,
	"hazardous" boolean DEFAULT false,
	"hazard_class" varchar(100),
	"volume" numeric(12, 2),
	"volume_unit" varchar(20) NOT NULL,
	"density" numeric(8, 4),
	"generation_date" timestamp NOT NULL,
	"generated_by" varchar(100),
	"handling_method" varchar(50),
	"treatment_method" varchar(100),
	"treatment_facility" varchar(255),
	"disposal_method" varchar(50),
	"disposal_facility" varchar(255),
	"disposal_facility_permit" varchar(100),
	"transporter_name" varchar(255),
	"transporter_permit" varchar(100),
	"transport_date" timestamp,
	"transport_vehicle" varchar(100),
	"regulatory_permit" varchar(100),
	"manifesting_required" boolean DEFAULT false,
	"manifest_number" varchar(100),
	"regulatory_agency" varchar(100),
	"treatment_cost" numeric(10, 2),
	"transportation_cost" numeric(10, 2),
	"disposal_cost" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"environmental_impact" jsonb,
	"recycling_percentage" numeric(5, 2),
	"status" varchar(20) DEFAULT 'generated' NOT NULL,
	"completion_date" timestamp,
	"documents" jsonb,
	"managed_by_user_id" uuid NOT NULL,
	"approved_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "well_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"well_id" uuid NOT NULL,
	"production_record_id" uuid NOT NULL,
	"analysis_date" date NOT NULL,
	"status" "well_performance_status" DEFAULT 'UNKNOWN' NOT NULL,
	"artificial_lift_method" "artificial_lift_method",
	"oil_rate" numeric(14, 3),
	"gas_rate" numeric(14, 3),
	"water_rate" numeric(14, 3),
	"average_tubing_pressure" numeric(10, 2),
	"average_casing_pressure" numeric(10, 2),
	"bottom_hole_pressure" numeric(10, 2),
	"reservoir_pressure" numeric(10, 2),
	"gas_oil_ratio" numeric(10, 2),
	"water_cut_percent" numeric(5, 2),
	"bsw_percent" numeric(5, 2),
	"api_gravity" numeric(6, 2),
	"productivity_index" numeric(8, 3),
	"drawdown_pressure" numeric(10, 2),
	"pump_speed" numeric(8, 2),
	"pumping_fluid_level" numeric(10, 2),
	"downtime_hours" numeric(8, 2),
	"downtime_reason" text,
	"downtime_details" jsonb,
	"optimization_recommendations" text,
	"performance_summary" text,
	"performance_metrics" jsonb,
	"benchmark_comparison" jsonb,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "well_performance_rate_positive_check" CHECK ((oil_rate IS NULL OR oil_rate >= 0)
          AND (gas_rate IS NULL OR gas_rate >= 0)
          AND (water_rate IS NULL OR water_rate >= 0)),
	CONSTRAINT "well_performance_percent_range_check" CHECK (
        (water_cut_percent IS NULL OR (water_cut_percent >= 0 AND water_cut_percent <= 100))
        AND (bsw_percent IS NULL OR (bsw_percent >= 0 AND bsw_percent <= 100))
      )
);
--> statement-breakpoint
CREATE TABLE "well_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"well_id" uuid NOT NULL,
	"conducted_by_user_id" uuid NOT NULL,
	"well_performance_id" uuid,
	"test_date" date NOT NULL,
	"test_type" varchar(20) NOT NULL,
	"test_method" "well_test_method",
	"validation_status" "well_test_validation_status" DEFAULT 'PENDING' NOT NULL,
	"validation_comments" text,
	"oil_rate" numeric(10, 2),
	"gas_rate" numeric(12, 2),
	"water_rate" numeric(10, 2),
	"flowing_pressure" numeric(8, 2),
	"static_pressure" numeric(8, 2),
	"productivity_index" numeric(8, 3),
	"skin_factor" numeric(8, 3),
	"reservoir_pressure" numeric(8, 2),
	"bubble_point_pressure" numeric(8, 2),
	"gas_oil_ratio" numeric(10, 2),
	"water_cut_percent" numeric(5, 2),
	"test_conditions" jsonb,
	"multiphase_flow_data" jsonb,
	"equipment_readings" jsonb,
	"validation_metadata" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "well_tests_rate_positive_check" CHECK ((oil_rate IS NULL OR oil_rate >= 0)
          AND (gas_rate IS NULL OR gas_rate >= 0)
          AND (water_rate IS NULL OR water_rate >= 0)),
	CONSTRAINT "well_tests_percent_range_check" CHECK (water_cut_percent IS NULL OR (water_cut_percent >= 0 AND water_cut_percent <= 100))
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
	CONSTRAINT "wells_api_number_unique" UNIQUE("api_number"),
	CONSTRAINT "api_format" CHECK (LENGTH(api_number) = 10 AND api_number ~ '^[0-9]+$'),
	CONSTRAINT "wells_total_depth_positive_check" CHECK (total_depth IS NULL OR total_depth >= 0)
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
ALTER TABLE "afe_approvals" ADD CONSTRAINT "afe_approvals_afe_id_afes_id_fk" FOREIGN KEY ("afe_id") REFERENCES "public"."afes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afe_approvals" ADD CONSTRAINT "afe_approvals_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afe_approvals" ADD CONSTRAINT "afe_approvals_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afe_line_items" ADD CONSTRAINT "afe_line_items_afe_id_afes_id_fk" FOREIGN KEY ("afe_id") REFERENCES "public"."afes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afe_line_items" ADD CONSTRAINT "afe_line_items_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afes" ADD CONSTRAINT "afes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afes" ADD CONSTRAINT "afes_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afes" ADD CONSTRAINT "afes_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_calls" ADD CONSTRAINT "cash_calls_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_calls" ADD CONSTRAINT "cash_calls_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_calls" ADD CONSTRAINT "cash_calls_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chain_of_title_entries" ADD CONSTRAINT "chain_of_title_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chain_of_title_entries" ADD CONSTRAINT "chain_of_title_entries_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_schedules" ADD CONSTRAINT "compliance_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_schedules" ADD CONSTRAINT "compliance_schedules_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curative_activities" ADD CONSTRAINT "curative_activities_curative_item_id_curative_items_id_fk" FOREIGN KEY ("curative_item_id") REFERENCES "public"."curative_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curative_item_documents" ADD CONSTRAINT "curative_item_documents_curative_item_id_curative_items_id_fk" FOREIGN KEY ("curative_item_id") REFERENCES "public"."curative_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curative_item_documents" ADD CONSTRAINT "curative_item_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curative_items" ADD CONSTRAINT "curative_items_title_opinion_id_title_opinions_id_fk" FOREIGN KEY ("title_opinion_id") REFERENCES "public"."title_opinions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_drilling_reports" ADD CONSTRAINT "daily_drilling_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_drilling_reports" ADD CONSTRAINT "daily_drilling_reports_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decline_curves" ADD CONSTRAINT "decline_curves_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decline_curves" ADD CONSTRAINT "decline_curves_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decline_curves" ADD CONSTRAINT "decline_curves_reserves_id_reserves_id_fk" FOREIGN KEY ("reserves_id") REFERENCES "public"."reserves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decline_curves" ADD CONSTRAINT "decline_curves_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "division_orders" ADD CONSTRAINT "division_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "division_orders" ADD CONSTRAINT "division_orders_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "division_orders" ADD CONSTRAINT "division_orders_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drilling_programs" ADD CONSTRAINT "drilling_programs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drilling_programs" ADD CONSTRAINT "drilling_programs_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drilling_programs" ADD CONSTRAINT "drilling_programs_afe_id_afes_id_fk" FOREIGN KEY ("afe_id") REFERENCES "public"."afes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drilling_programs" ADD CONSTRAINT "drilling_programs_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drilling_programs" ADD CONSTRAINT "drilling_programs_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_production" ADD CONSTRAINT "enhanced_production_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_production" ADD CONSTRAINT "enhanced_production_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_production" ADD CONSTRAINT "enhanced_production_production_record_id_production_records_id_fk" FOREIGN KEY ("production_record_id") REFERENCES "public"."production_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_production" ADD CONSTRAINT "enhanced_production_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environmental_incidents" ADD CONSTRAINT "environmental_incidents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environmental_incidents" ADD CONSTRAINT "environmental_incidents_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environmental_incidents" ADD CONSTRAINT "environmental_incidents_reported_by_user_id_users_id_fk" FOREIGN KEY ("reported_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environmental_monitoring" ADD CONSTRAINT "environmental_monitoring_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environmental_monitoring" ADD CONSTRAINT "environmental_monitoring_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formation_tops" ADD CONSTRAINT "formation_tops_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formation_tops" ADD CONSTRAINT "formation_tops_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formation_tops" ADD CONSTRAINT "formation_tops_geological_data_id_geological_data_id_fk" FOREIGN KEY ("geological_data_id") REFERENCES "public"."geological_data"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geological_data" ADD CONSTRAINT "geological_data_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geological_data" ADD CONSTRAINT "geological_data_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geological_data" ADD CONSTRAINT "geological_data_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geological_data" ADD CONSTRAINT "geological_data_interpreted_by_user_id_users_id_fk" FOREIGN KEY ("interpreted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hse_incidents" ADD CONSTRAINT "hse_incidents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hse_incidents" ADD CONSTRAINT "hse_incidents_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hse_incidents" ADD CONSTRAINT "hse_incidents_reported_by_user_id_users_id_fk" FOREIGN KEY ("reported_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hse_incidents" ADD CONSTRAINT "hse_incidents_investigation_lead_user_id_users_id_fk" FOREIGN KEY ("investigation_lead_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_responses" ADD CONSTRAINT "incident_responses_incident_id_hse_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."hse_incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_responses" ADD CONSTRAINT "incident_responses_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_responses" ADD CONSTRAINT "incident_responses_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD CONSTRAINT "jib_statements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD CONSTRAINT "jib_statements_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD CONSTRAINT "jib_statements_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jib_statements" ADD CONSTRAINT "jib_statements_cash_call_id_cash_calls_id_fk" FOREIGN KEY ("cash_call_id") REFERENCES "public"."cash_calls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "joint_operating_agreements" ADD CONSTRAINT "joint_operating_agreements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_operating_statements" ADD CONSTRAINT "lease_operating_statements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_operating_statements" ADD CONSTRAINT "lease_operating_statements_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_partners" ADD CONSTRAINT "lease_partners_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_partners" ADD CONSTRAINT "lease_partners_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_payments" ADD CONSTRAINT "owner_payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_payments" ADD CONSTRAINT "owner_payments_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_payments" ADD CONSTRAINT "owner_payments_revenue_distribution_id_revenue_distributions_id_fk" FOREIGN KEY ("revenue_distribution_id") REFERENCES "public"."revenue_distributions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_renewals" ADD CONSTRAINT "permit_renewals_permit_id_permits_id_fk" FOREIGN KEY ("permit_id") REFERENCES "public"."permits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_allocation" ADD CONSTRAINT "production_allocation_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_allocation" ADD CONSTRAINT "production_allocation_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_allocation" ADD CONSTRAINT "production_allocation_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_allocation" ADD CONSTRAINT "production_allocation_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_records" ADD CONSTRAINT "production_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_records" ADD CONSTRAINT "production_records_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_filings" ADD CONSTRAINT "regulatory_filings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_filings" ADD CONSTRAINT "regulatory_filings_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_filings" ADD CONSTRAINT "regulatory_filings_filed_by_user_id_users_id_fk" FOREIGN KEY ("filed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_reports" ADD CONSTRAINT "regulatory_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_reports" ADD CONSTRAINT "regulatory_reports_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_reports" ADD CONSTRAINT "regulatory_reports_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_reports" ADD CONSTRAINT "regulatory_reports_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_reports" ADD CONSTRAINT "regulatory_reports_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserves" ADD CONSTRAINT "reserves_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserves" ADD CONSTRAINT "reserves_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserves" ADD CONSTRAINT "reserves_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserves" ADD CONSTRAINT "reserves_evaluator_partner_id_partners_id_fk" FOREIGN KEY ("evaluator_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserves_validations" ADD CONSTRAINT "reserves_validations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserves_validations" ADD CONSTRAINT "reserves_validations_reserves_id_reserves_id_fk" FOREIGN KEY ("reserves_id") REFERENCES "public"."reserves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserves_validations" ADD CONSTRAINT "reserves_validations_validator_partner_id_partners_id_fk" FOREIGN KEY ("validator_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserves_validations" ADD CONSTRAINT "reserves_validations_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserves_validations" ADD CONSTRAINT "reserves_validations_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD CONSTRAINT "revenue_distributions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD CONSTRAINT "revenue_distributions_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD CONSTRAINT "revenue_distributions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD CONSTRAINT "revenue_distributions_division_order_id_division_orders_id_fk" FOREIGN KEY ("division_order_id") REFERENCES "public"."division_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spill_reports" ADD CONSTRAINT "spill_reports_environmental_incident_id_environmental_incidents_id_fk" FOREIGN KEY ("environmental_incident_id") REFERENCES "public"."environmental_incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_opinion_documents" ADD CONSTRAINT "title_opinion_documents_title_opinion_id_title_opinions_id_fk" FOREIGN KEY ("title_opinion_id") REFERENCES "public"."title_opinions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_opinion_documents" ADD CONSTRAINT "title_opinion_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_opinions" ADD CONSTRAINT "title_opinions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_opinions" ADD CONSTRAINT "title_opinions_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_contracts" ADD CONSTRAINT "vendor_contracts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_contracts" ADD CONSTRAINT "vendor_contracts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_performance_reviews" ADD CONSTRAINT "vendor_performance_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_performance_reviews" ADD CONSTRAINT "vendor_performance_reviews_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_performance_reviews" ADD CONSTRAINT "vendor_performance_reviews_contract_id_vendor_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."vendor_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_qualifications" ADD CONSTRAINT "vendor_qualifications_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste_management" ADD CONSTRAINT "waste_management_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste_management" ADD CONSTRAINT "waste_management_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_performance" ADD CONSTRAINT "well_performance_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_performance" ADD CONSTRAINT "well_performance_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_performance" ADD CONSTRAINT "well_performance_production_record_id_production_records_id_fk" FOREIGN KEY ("production_record_id") REFERENCES "public"."production_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_performance" ADD CONSTRAINT "well_performance_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_performance" ADD CONSTRAINT "well_performance_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_conducted_by_user_id_users_id_fk" FOREIGN KEY ("conducted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_well_performance_id_well_performance_id_fk" FOREIGN KEY ("well_performance_id") REFERENCES "public"."well_performance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "wells_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "wells_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workovers" ADD CONSTRAINT "workovers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workovers" ADD CONSTRAINT "workovers_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workovers" ADD CONSTRAINT "workovers_afe_id_afes_id_fk" FOREIGN KEY ("afe_id") REFERENCES "public"."afes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "chain_of_title_organization_id_idx" ON "chain_of_title_entries" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "chain_of_title_lease_id_idx" ON "chain_of_title_entries" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "chain_of_title_instrument_type_idx" ON "chain_of_title_entries" USING btree ("instrument_type");--> statement-breakpoint
CREATE INDEX "chain_of_title_instrument_date_idx" ON "chain_of_title_entries" USING btree ("instrument_date");--> statement-breakpoint
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
CREATE INDEX "curative_activities_curative_item_id_idx" ON "curative_activities" USING btree ("curative_item_id");--> statement-breakpoint
CREATE INDEX "curative_activities_action_type_idx" ON "curative_activities" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "curative_activities_action_date_idx" ON "curative_activities" USING btree ("action_date");--> statement-breakpoint
CREATE UNIQUE INDEX "curative_item_documents_unique" ON "curative_item_documents" USING btree ("curative_item_id","document_id");--> statement-breakpoint
CREATE INDEX "curative_item_documents_curative_item_id_idx" ON "curative_item_documents" USING btree ("curative_item_id");--> statement-breakpoint
CREATE INDEX "curative_item_documents_document_id_idx" ON "curative_item_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "curative_item_documents_role_idx" ON "curative_item_documents" USING btree ("role");--> statement-breakpoint
CREATE INDEX "curative_items_title_opinion_id_idx" ON "curative_items" USING btree ("title_opinion_id");--> statement-breakpoint
CREATE INDEX "curative_items_defect_type_idx" ON "curative_items" USING btree ("defect_type");--> statement-breakpoint
CREATE INDEX "curative_items_priority_idx" ON "curative_items" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "curative_items_status_idx" ON "curative_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "curative_items_due_date_idx" ON "curative_items" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "ddr_org_idx" ON "daily_drilling_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ddr_well_idx" ON "daily_drilling_reports" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "ddr_date_idx" ON "daily_drilling_reports" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "ddr_well_date_idx" ON "daily_drilling_reports" USING btree ("well_id","report_date");--> statement-breakpoint
CREATE INDEX "decline_curves_organization_idx" ON "decline_curves" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "decline_curves_well_idx" ON "decline_curves" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "decline_curves_reserves_idx" ON "decline_curves" USING btree ("reserves_id");--> statement-breakpoint
CREATE INDEX "decline_curves_analysis_date_idx" ON "decline_curves" USING btree ("analysis_date");--> statement-breakpoint
CREATE INDEX "decline_curves_phase_idx" ON "decline_curves" USING btree ("phase");--> statement-breakpoint
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
CREATE INDEX "drilling_programs_org_idx" ON "drilling_programs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "drilling_programs_well_idx" ON "drilling_programs" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "drilling_programs_afe_idx" ON "drilling_programs" USING btree ("afe_id");--> statement-breakpoint
CREATE INDEX "drilling_programs_status_idx" ON "drilling_programs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "enhanced_production_organization_idx" ON "enhanced_production" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "enhanced_production_well_idx" ON "enhanced_production" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "enhanced_production_measurement_idx" ON "enhanced_production" USING btree ("measurement_timestamp");--> statement-breakpoint
CREATE INDEX "environmental_incidents_organization_id_idx" ON "environmental_incidents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "environmental_incidents_well_id_idx" ON "environmental_incidents" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "environmental_incidents_incident_number_idx" ON "environmental_incidents" USING btree ("incident_number");--> statement-breakpoint
CREATE INDEX "environmental_incidents_incident_type_idx" ON "environmental_incidents" USING btree ("incident_type");--> statement-breakpoint
CREATE INDEX "environmental_incidents_severity_idx" ON "environmental_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "environmental_incidents_status_idx" ON "environmental_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "environmental_incidents_incident_date_idx" ON "environmental_incidents" USING btree ("incident_date");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_organization_id_idx" ON "environmental_monitoring" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_well_id_idx" ON "environmental_monitoring" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_monitoring_type_idx" ON "environmental_monitoring" USING btree ("monitoring_type");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_monitoring_category_idx" ON "environmental_monitoring" USING btree ("monitoring_category");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_parameter_idx" ON "environmental_monitoring" USING btree ("parameter");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_monitoring_date_idx" ON "environmental_monitoring" USING btree ("monitoring_date");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_monitoring_point_id_idx" ON "environmental_monitoring" USING btree ("monitoring_point_id");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_due_date_idx" ON "environmental_monitoring" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_is_compliant_idx" ON "environmental_monitoring" USING btree ("is_compliant");--> statement-breakpoint
CREATE INDEX "equipment_well_id_idx" ON "equipment" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "equipment_equipment_type_idx" ON "equipment" USING btree ("equipment_type");--> statement-breakpoint
CREATE INDEX "equipment_status_idx" ON "equipment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "equipment_serial_number_idx" ON "equipment" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "formation_tops_organization_idx" ON "formation_tops" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "formation_tops_well_idx" ON "formation_tops" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "formation_tops_formation_idx" ON "formation_tops" USING btree ("formation_name");--> statement-breakpoint
CREATE INDEX "geological_data_organization_idx" ON "geological_data" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "geological_data_well_idx" ON "geological_data" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "geological_data_version_idx" ON "geological_data" USING btree ("well_id","version");--> statement-breakpoint
CREATE INDEX "hse_incidents_organization_id_idx" ON "hse_incidents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "hse_incidents_well_id_idx" ON "hse_incidents" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "hse_incidents_incident_number_idx" ON "hse_incidents" USING btree ("incident_number");--> statement-breakpoint
CREATE INDEX "hse_incidents_incident_type_idx" ON "hse_incidents" USING btree ("incident_type");--> statement-breakpoint
CREATE INDEX "hse_incidents_severity_idx" ON "hse_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "hse_incidents_status_idx" ON "hse_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hse_incidents_investigation_status_idx" ON "hse_incidents" USING btree ("investigation_status");--> statement-breakpoint
CREATE INDEX "hse_incidents_incident_date_idx" ON "hse_incidents" USING btree ("incident_date");--> statement-breakpoint
CREATE INDEX "hse_incidents_notification_deadline_idx" ON "hse_incidents" USING btree ("notification_deadline");--> statement-breakpoint
CREATE INDEX "incident_responses_incident_id_idx" ON "incident_responses" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "incident_responses_response_type_idx" ON "incident_responses" USING btree ("response_type");--> statement-breakpoint
CREATE INDEX "incident_responses_assigned_user_id_idx" ON "incident_responses" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "incident_responses_status_idx" ON "incident_responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "incident_responses_due_date_idx" ON "incident_responses" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "incident_responses_notification_date_idx" ON "incident_responses" USING btree ("notification_date");--> statement-breakpoint
CREATE INDEX "jib_statements_organization_id_idx" ON "jib_statements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "jib_statements_partner_id_idx" ON "jib_statements" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "jib_statements_lease_id_idx" ON "jib_statements" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "jib_statements_status_idx" ON "jib_statements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jib_statements_period_idx" ON "jib_statements" USING btree ("statement_period_start","statement_period_end");--> statement-breakpoint
CREATE INDEX "jib_statements_partner_period_idx" ON "jib_statements" USING btree ("partner_id","statement_period_start");--> statement-breakpoint
CREATE INDEX "jib_statements_due_date_idx" ON "jib_statements" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "jib_statements_cash_call_idx" ON "jib_statements" USING btree ("cash_call_id");--> statement-breakpoint
CREATE INDEX "joa_org_idx" ON "joint_operating_agreements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "joa_status_idx" ON "joint_operating_agreements" USING btree ("status");--> statement-breakpoint
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
CREATE INDEX "maintenance_org_idx" ON "maintenance_schedules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "maintenance_equipment_idx" ON "maintenance_schedules" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "maintenance_vendor_idx" ON "maintenance_schedules" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "maintenance_date_idx" ON "maintenance_schedules" USING btree ("schedule_date");--> statement-breakpoint
CREATE INDEX "maintenance_status_idx" ON "maintenance_schedules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "owner_payments_org_idx" ON "owner_payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "owner_payments_partner_idx" ON "owner_payments" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "owner_payments_rd_idx" ON "owner_payments" USING btree ("revenue_distribution_id");--> statement-breakpoint
CREATE INDEX "owner_payments_status_idx" ON "owner_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "owner_payments_date_idx" ON "owner_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "partners_organization_id_idx" ON "partners" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "partners_is_active_idx" ON "partners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "password_history_user_id_created_at_idx" ON "password_history" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "password_history_user_id_idx" ON "password_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "permit_renewals_permit_id_idx" ON "permit_renewals" USING btree ("permit_id");--> statement-breakpoint
CREATE INDEX "permit_renewals_renewal_due_date_idx" ON "permit_renewals" USING btree ("renewal_due_date");--> statement-breakpoint
CREATE INDEX "permit_renewals_status_idx" ON "permit_renewals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "permits_organization_id_idx" ON "permits" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "permits_well_id_idx" ON "permits" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "permits_permit_number_idx" ON "permits" USING btree ("permit_number");--> statement-breakpoint
CREATE INDEX "permits_permit_type_idx" ON "permits" USING btree ("permit_type");--> statement-breakpoint
CREATE INDEX "permits_status_idx" ON "permits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "permits_issuing_agency_idx" ON "permits" USING btree ("issuing_agency");--> statement-breakpoint
CREATE INDEX "permits_expiration_date_idx" ON "permits" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "permits_application_date_idx" ON "permits" USING btree ("application_date");--> statement-breakpoint
CREATE INDEX "production_allocation_organization_idx" ON "production_allocation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "production_allocation_lease_idx" ON "production_allocation" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "production_allocation_well_idx" ON "production_allocation" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "production_allocation_period_idx" ON "production_allocation" USING btree ("allocation_period_start","allocation_period_end");--> statement-breakpoint
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
CREATE INDEX "regulatory_reports_organization_id_idx" ON "regulatory_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "regulatory_reports_well_id_idx" ON "regulatory_reports" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "regulatory_reports_report_type_idx" ON "regulatory_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "regulatory_reports_regulatory_agency_idx" ON "regulatory_reports" USING btree ("regulatory_agency");--> statement-breakpoint
CREATE INDEX "regulatory_reports_status_idx" ON "regulatory_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "regulatory_reports_due_date_idx" ON "regulatory_reports" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "regulatory_reports_reporting_period_idx" ON "regulatory_reports" USING btree ("reporting_period_start","reporting_period_end");--> statement-breakpoint
CREATE INDEX "regulatory_reports_priority_idx" ON "regulatory_reports" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "regulatory_reports_validation_status_idx" ON "regulatory_reports" USING btree ("validation_status");--> statement-breakpoint
CREATE INDEX "regulatory_reports_compliance_status_idx" ON "regulatory_reports" USING btree ("compliance_status");--> statement-breakpoint
CREATE INDEX "regulatory_reports_auto_generation_idx" ON "regulatory_reports" USING btree ("next_auto_generation");--> statement-breakpoint
CREATE INDEX "regulatory_reports_permit_id_idx" ON "regulatory_reports" USING btree ("permit_id");--> statement-breakpoint
CREATE INDEX "regulatory_reports_incident_id_idx" ON "regulatory_reports" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "regulatory_reports_environmental_monitoring_id_idx" ON "regulatory_reports" USING btree ("environmental_monitoring_id");--> statement-breakpoint
CREATE INDEX "regulatory_reports_waste_management_id_idx" ON "regulatory_reports" USING btree ("waste_management_id");--> statement-breakpoint
CREATE INDEX "regulatory_reports_org_report_type_idx" ON "regulatory_reports" USING btree ("organization_id","report_type","reporting_period_start");--> statement-breakpoint
CREATE INDEX "regulatory_reports_status_due_date_idx" ON "regulatory_reports" USING btree ("status","due_date");--> statement-breakpoint
CREATE INDEX "reserves_organization_idx" ON "reserves" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "reserves_well_idx" ON "reserves" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "reserves_evaluation_date_idx" ON "reserves" USING btree ("evaluation_date");--> statement-breakpoint
CREATE INDEX "reserves_cat_class_idx" ON "reserves" USING btree ("category","classification");--> statement-breakpoint
CREATE INDEX "reserves_validations_organization_idx" ON "reserves_validations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "reserves_validations_reserves_idx" ON "reserves_validations" USING btree ("reserves_id");--> statement-breakpoint
CREATE INDEX "reserves_validations_status_idx" ON "reserves_validations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reserves_validations_request_date_idx" ON "reserves_validations" USING btree ("request_date");--> statement-breakpoint
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
CREATE UNIQUE INDEX "title_opinion_documents_unique" ON "title_opinion_documents" USING btree ("title_opinion_id","document_id");--> statement-breakpoint
CREATE INDEX "title_opinion_documents_title_opinion_id_idx" ON "title_opinion_documents" USING btree ("title_opinion_id");--> statement-breakpoint
CREATE INDEX "title_opinion_documents_document_id_idx" ON "title_opinion_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "title_opinion_documents_role_idx" ON "title_opinion_documents" USING btree ("role");--> statement-breakpoint
CREATE INDEX "title_opinions_organization_id_idx" ON "title_opinions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "title_opinions_lease_id_idx" ON "title_opinions" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "title_opinions_opinion_number_idx" ON "title_opinions" USING btree ("opinion_number");--> statement-breakpoint
CREATE INDEX "title_opinions_title_status_idx" ON "title_opinions" USING btree ("title_status");--> statement-breakpoint
CREATE INDEX "title_opinions_examination_date_idx" ON "title_opinions" USING btree ("examination_date");--> statement-breakpoint
CREATE INDEX "users_organization_id_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_email_verification_token_idx" ON "users" USING btree ("email_verification_token");--> statement-breakpoint
CREATE INDEX "users_password_reset_token_idx" ON "users" USING btree ("password_reset_token");--> statement-breakpoint
CREATE INDEX "vendor_contacts_vendor_id_idx" ON "vendor_contacts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_contacts_contact_type_idx" ON "vendor_contacts" USING btree ("contact_type");--> statement-breakpoint
CREATE INDEX "vendor_contacts_is_primary_idx" ON "vendor_contacts" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "vendor_contacts_is_emergency_idx" ON "vendor_contacts" USING btree ("is_emergency_contact");--> statement-breakpoint
CREATE INDEX "vendor_contacts_is_active_idx" ON "vendor_contacts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "vendor_contacts_email_idx" ON "vendor_contacts" USING btree ("email");--> statement-breakpoint
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
CREATE INDEX "vendors_organization_id_idx" ON "vendors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendors_vendor_type_idx" ON "vendors" USING btree ("vendor_type");--> statement-breakpoint
CREATE INDEX "vendors_status_idx" ON "vendors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendors_is_active_idx" ON "vendors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "vendors_is_prequalified_idx" ON "vendors" USING btree ("is_prequalified");--> statement-breakpoint
CREATE INDEX "vendors_overall_rating_idx" ON "vendors" USING btree ("overall_rating");--> statement-breakpoint
CREATE INDEX "vendors_qualification_expiry_idx" ON "vendors" USING btree ("qualification_expiry_date");--> statement-breakpoint
CREATE INDEX "vendors_last_evaluation_idx" ON "vendors" USING btree ("last_evaluation_date");--> statement-breakpoint
CREATE INDEX "waste_management_organization_id_idx" ON "waste_management" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "waste_management_well_id_idx" ON "waste_management" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "waste_management_waste_type_idx" ON "waste_management" USING btree ("waste_type");--> statement-breakpoint
CREATE INDEX "waste_management_waste_category_idx" ON "waste_management" USING btree ("waste_category");--> statement-breakpoint
CREATE INDEX "waste_management_waste_manifest_id_idx" ON "waste_management" USING btree ("waste_manifest_id");--> statement-breakpoint
CREATE INDEX "waste_management_status_idx" ON "waste_management" USING btree ("status");--> statement-breakpoint
CREATE INDEX "waste_management_generation_date_idx" ON "waste_management" USING btree ("generation_date");--> statement-breakpoint
CREATE INDEX "waste_management_regulatory_agency_idx" ON "waste_management" USING btree ("regulatory_agency");--> statement-breakpoint
CREATE INDEX "waste_management_hazardous_idx" ON "waste_management" USING btree ("hazardous");--> statement-breakpoint
CREATE INDEX "well_performance_organization_idx" ON "well_performance" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "well_performance_well_idx" ON "well_performance" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "well_performance_analysis_date_idx" ON "well_performance" USING btree ("analysis_date");--> statement-breakpoint
CREATE INDEX "well_performance_status_lookup" ON "well_performance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "well_performance_production_record_idx" ON "well_performance" USING btree ("production_record_id");--> statement-breakpoint
CREATE INDEX "well_tests_well_id_idx" ON "well_tests" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "well_tests_conducted_by_idx" ON "well_tests" USING btree ("conducted_by_user_id");--> statement-breakpoint
CREATE INDEX "well_tests_test_date_idx" ON "well_tests" USING btree ("test_date");--> statement-breakpoint
CREATE INDEX "well_tests_test_type_idx" ON "well_tests" USING btree ("test_type");--> statement-breakpoint
CREATE INDEX "well_tests_well_date_idx" ON "well_tests" USING btree ("well_id","test_date");--> statement-breakpoint
CREATE INDEX "wells_organization_id_idx" ON "wells" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "wells_lease_id_idx" ON "wells" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "workovers_org_idx" ON "workovers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workovers_well_idx" ON "workovers" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "workovers_afe_idx" ON "workovers" USING btree ("afe_id");--> statement-breakpoint
CREATE INDEX "workovers_status_idx" ON "workovers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workovers_dates_idx" ON "workovers" USING btree ("start_date","end_date");