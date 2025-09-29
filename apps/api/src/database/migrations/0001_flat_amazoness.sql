CREATE TABLE "token_blacklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jti" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"token_type" varchar(50) NOT NULL,
	"blacklisted_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"reason" varchar(100) DEFAULT 'logout' NOT NULL,
	"ip_address" varchar(45),
	"user_agent" varchar(500)
);
--> statement-breakpoint
ALTER TABLE "wells" DROP CONSTRAINT "api_format";--> statement-breakpoint
ALTER TABLE "token_blacklist" ADD CONSTRAINT "token_blacklist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "token_blacklist_jti_idx" ON "token_blacklist" USING btree ("jti");--> statement-breakpoint
CREATE INDEX "token_blacklist_user_id_idx" ON "token_blacklist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "token_blacklist_expires_at_idx" ON "token_blacklist" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "token_blacklist_user_id_token_type_idx" ON "token_blacklist" USING btree ("user_id","token_type");--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "api_format" CHECK (LENGTH(api_number) = 10 AND api_number ~ '^[0-9]+$');