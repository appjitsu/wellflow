ALTER TABLE "lease_partners" ADD CONSTRAINT "lease_partners_percentage_range_check" CHECK (working_interest_percent >= 0 AND working_interest_percent <= 1 AND
          royalty_interest_percent >= 0 AND royalty_interest_percent <= 1 AND
          net_revenue_interest_percent >= 0 AND net_revenue_interest_percent <= 1);--> statement-breakpoint
ALTER TABLE "lease_partners" ADD CONSTRAINT "lease_partners_date_range_check" CHECK (end_date IS NULL OR effective_date <= end_date);--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_royalty_rate_range_check" CHECK (royalty_rate IS NULL OR (royalty_rate >= 0 AND royalty_rate <= 1));--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_acreage_positive_check" CHECK (acreage IS NULL OR acreage > 0);--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_date_range_check" CHECK (expiration_date IS NULL OR effective_date IS NULL OR effective_date <= expiration_date);--> statement-breakpoint
ALTER TABLE "production_records" ADD CONSTRAINT "production_records_positive_volumes_check" CHECK ((oil_volume IS NULL OR oil_volume >= 0) AND
          (gas_volume IS NULL OR gas_volume >= 0) AND
          (water_volume IS NULL OR water_volume >= 0));--> statement-breakpoint
ALTER TABLE "production_records" ADD CONSTRAINT "production_records_positive_prices_check" CHECK ((oil_price IS NULL OR oil_price >= 0) AND
          (gas_price IS NULL OR gas_price >= 0));--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "wells_api_number_format_check" CHECK (LENGTH(api_number) = 14 AND api_number ~ '^[0-9]+$');--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "wells_total_depth_positive_check" CHECK (total_depth IS NULL OR total_depth >= 0);