ALTER TABLE "revenue_distributions" ALTER COLUMN "total_revenue" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "revenue_distributions" ALTER COLUMN "net_revenue" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD COLUMN "ad_valorem" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD COLUMN "transportation_costs" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD COLUMN "processing_costs" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD COLUMN "other_deductions" numeric(12, 2);