CREATE TYPE "public"."artificial_lift_method" AS ENUM('NATURAL_FLOW', 'ROD_PUMP', 'ESP', 'GAS_LIFT', 'PLUNGER_LIFT', 'HYDRAULIC_PUMP', 'PROGRESSING_CAVITY', 'JET_PUMP', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."decline_curve_method" AS ENUM('ARPS', 'DUONG', 'MODIFIED_ARPS', 'EXPONENTIAL', 'HARMONIC', 'HYPERBOLIC', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."geological_data_source" AS ENUM('LOGGING', 'CORE', 'SEISMIC', 'PRESSURE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."geological_interpretation_status" AS ENUM('DRAFT', 'IN_PROGRESS', 'APPROVED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."geological_log_type" AS ENUM('GAMMA_RAY', 'RESISTIVITY', 'NEUTRON', 'DENSITY', 'SONIC', 'IMAGING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."production_data_source" AS ENUM('SCADA', 'MANUAL', 'ALLOCATED', 'SIMULATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."reserves_category" AS ENUM('PROVED_DEVELOPED_PRODUCING', 'PROVED_DEVELOPED_NON_PRODUCING', 'PROVED_UNDEVELOPED', 'PROBABLE', 'POSSIBLE');--> statement-breakpoint
CREATE TYPE "public"."reserves_classification" AS ENUM('SEC', 'PRMS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."reserves_validation_status" AS ENUM('REQUESTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."well_performance_status" AS ENUM('OPTIMAL', 'DECLINING', 'INTERVENTION_REQUIRED', 'SHUT_IN', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."well_test_method" AS ENUM('FLOWING', 'BUILDUP', 'DRAW_DOWN', 'MULTI_RATE', 'INTERFERENCE', 'PVT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."well_test_validation_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
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
ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lockout_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "well_performance_id" uuid;--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "test_method" "well_test_method";--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "validation_status" "well_test_validation_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "validation_comments" text;--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "productivity_index" numeric(8, 3);--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "skin_factor" numeric(8, 3);--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "reservoir_pressure" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "bubble_point_pressure" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "gas_oil_ratio" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "water_cut_percent" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "multiphase_flow_data" jsonb;--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "equipment_readings" jsonb;--> statement-breakpoint
ALTER TABLE "well_tests" ADD COLUMN "validation_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "decline_curves" ADD CONSTRAINT "decline_curves_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decline_curves" ADD CONSTRAINT "decline_curves_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decline_curves" ADD CONSTRAINT "decline_curves_reserves_id_reserves_id_fk" FOREIGN KEY ("reserves_id") REFERENCES "public"."reserves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decline_curves" ADD CONSTRAINT "decline_curves_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_production" ADD CONSTRAINT "enhanced_production_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_production" ADD CONSTRAINT "enhanced_production_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_production" ADD CONSTRAINT "enhanced_production_production_record_id_production_records_id_fk" FOREIGN KEY ("production_record_id") REFERENCES "public"."production_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_production" ADD CONSTRAINT "enhanced_production_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environmental_monitoring" ADD CONSTRAINT "environmental_monitoring_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environmental_monitoring" ADD CONSTRAINT "environmental_monitoring_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "permit_renewals" ADD CONSTRAINT "permit_renewals_permit_id_permits_id_fk" FOREIGN KEY ("permit_id") REFERENCES "public"."permits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_allocation" ADD CONSTRAINT "production_allocation_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_allocation" ADD CONSTRAINT "production_allocation_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_allocation" ADD CONSTRAINT "production_allocation_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_allocation" ADD CONSTRAINT "production_allocation_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "waste_management" ADD CONSTRAINT "waste_management_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste_management" ADD CONSTRAINT "waste_management_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_performance" ADD CONSTRAINT "well_performance_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_performance" ADD CONSTRAINT "well_performance_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_performance" ADD CONSTRAINT "well_performance_production_record_id_production_records_id_fk" FOREIGN KEY ("production_record_id") REFERENCES "public"."production_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_performance" ADD CONSTRAINT "well_performance_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_performance" ADD CONSTRAINT "well_performance_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "decline_curves_organization_idx" ON "decline_curves" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "decline_curves_well_idx" ON "decline_curves" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "decline_curves_reserves_idx" ON "decline_curves" USING btree ("reserves_id");--> statement-breakpoint
CREATE INDEX "decline_curves_analysis_date_idx" ON "decline_curves" USING btree ("analysis_date");--> statement-breakpoint
CREATE INDEX "decline_curves_phase_idx" ON "decline_curves" USING btree ("phase");--> statement-breakpoint
CREATE INDEX "enhanced_production_organization_idx" ON "enhanced_production" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "enhanced_production_well_idx" ON "enhanced_production" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "enhanced_production_measurement_idx" ON "enhanced_production" USING btree ("measurement_timestamp");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_organization_id_idx" ON "environmental_monitoring" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_well_id_idx" ON "environmental_monitoring" USING btree ("well_id");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_monitoring_type_idx" ON "environmental_monitoring" USING btree ("monitoring_type");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_monitoring_category_idx" ON "environmental_monitoring" USING btree ("monitoring_category");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_parameter_idx" ON "environmental_monitoring" USING btree ("parameter");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_monitoring_date_idx" ON "environmental_monitoring" USING btree ("monitoring_date");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_monitoring_point_id_idx" ON "environmental_monitoring" USING btree ("monitoring_point_id");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_due_date_idx" ON "environmental_monitoring" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "environmental_monitoring_is_compliant_idx" ON "environmental_monitoring" USING btree ("is_compliant");--> statement-breakpoint
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
ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_well_performance_id_well_performance_id_fk" FOREIGN KEY ("well_performance_id") REFERENCES "public"."well_performance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_email_verification_token_idx" ON "users" USING btree ("email_verification_token");--> statement-breakpoint
CREATE INDEX "users_password_reset_token_idx" ON "users" USING btree ("password_reset_token");--> statement-breakpoint
ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_rate_positive_check" CHECK ((oil_rate IS NULL OR oil_rate >= 0)
          AND (gas_rate IS NULL OR gas_rate >= 0)
          AND (water_rate IS NULL OR water_rate >= 0));--> statement-breakpoint
ALTER TABLE "well_tests" ADD CONSTRAINT "well_tests_percent_range_check" CHECK (water_cut_percent IS NULL OR (water_cut_percent >= 0 AND water_cut_percent <= 100));