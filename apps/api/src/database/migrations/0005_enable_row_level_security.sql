-- Enable Row Level Security Migration
-- This migration enables RLS on all tenant-specific tables and creates policies for multi-tenant data isolation

-- First, ensure we have an application role for RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'application_role') THEN
        CREATE ROLE application_role;
    END IF;
END
$$;

-- Grant necessary permissions to application_role
GRANT USAGE ON SCHEMA public TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO application_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO application_role;

-- Enable RLS on all tenant-specific tables
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wells" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "production_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "partners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lease_partners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compliance_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "jib_statements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "well_tests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "afes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "afe_line_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "afe_approvals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "division_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "revenue_distributions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lease_operating_statements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vendor_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "title_opinions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "curative_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "environmental_incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "spill_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "regulatory_filings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compliance_schedules" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
-- Organizations table - users can only see their own organization
CREATE POLICY tenant_isolation_organizations ON organizations
  FOR ALL TO application_role
  USING (id = current_setting('app.current_organization_id', true)::uuid);

-- Users table - users can only see users from their organization
CREATE POLICY tenant_isolation_users ON users
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Leases table - organization-based isolation
CREATE POLICY tenant_isolation_leases ON leases
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Wells table - organization-based isolation
CREATE POLICY tenant_isolation_wells ON wells
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Production records table - organization-based isolation via wells
CREATE POLICY tenant_isolation_production_records ON production_records
  FOR ALL TO application_role
  USING (well_id IN (
    SELECT id FROM wells WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
  ));

-- Partners table - organization-based isolation
CREATE POLICY tenant_isolation_partners ON partners
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Lease partners table - organization-based isolation via leases
CREATE POLICY tenant_isolation_lease_partners ON lease_partners
  FOR ALL TO application_role
  USING (lease_id IN (
    SELECT id FROM leases WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
  ));

-- Compliance reports table - organization-based isolation
CREATE POLICY tenant_isolation_compliance_reports ON compliance_reports
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- JIB statements table - organization-based isolation
CREATE POLICY tenant_isolation_jib_statements ON jib_statements
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Documents table - organization-based isolation
CREATE POLICY tenant_isolation_documents ON documents
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Equipment table - organization-based isolation via wells
CREATE POLICY tenant_isolation_equipment ON equipment
  FOR ALL TO application_role
  USING (well_id IN (
    SELECT id FROM wells WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
  ));

-- Well tests table - organization-based isolation via wells
CREATE POLICY tenant_isolation_well_tests ON well_tests
  FOR ALL TO application_role
  USING (well_id IN (
    SELECT id FROM wells WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
  ));

-- AFEs table - organization-based isolation
CREATE POLICY tenant_isolation_afes ON afes
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- AFE line items table - organization-based isolation via AFEs
CREATE POLICY tenant_isolation_afe_line_items ON afe_line_items
  FOR ALL TO application_role
  USING (afe_id IN (
    SELECT id FROM afes WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
  ));

-- AFE approvals table - organization-based isolation via AFEs
CREATE POLICY tenant_isolation_afe_approvals ON afe_approvals
  FOR ALL TO application_role
  USING (afe_id IN (
    SELECT id FROM afes WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
  ));

-- Division orders table - organization-based isolation
CREATE POLICY tenant_isolation_division_orders ON division_orders
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Revenue distributions table - organization-based isolation
CREATE POLICY tenant_isolation_revenue_distributions ON revenue_distributions
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Lease operating statements table - organization-based isolation
CREATE POLICY tenant_isolation_lease_operating_statements ON lease_operating_statements
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Vendors table - organization-based isolation
CREATE POLICY tenant_isolation_vendors ON vendors
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Vendor contacts table - organization-based isolation via vendors
CREATE POLICY tenant_isolation_vendor_contacts ON vendor_contacts
  FOR ALL TO application_role
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
  ));

-- Title opinions table - organization-based isolation
CREATE POLICY tenant_isolation_title_opinions ON title_opinions
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Curative items table - organization-based isolation via title opinions
CREATE POLICY tenant_isolation_curative_items ON curative_items
  FOR ALL TO application_role
  USING (title_opinion_id IN (
    SELECT id FROM title_opinions WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
  ));

-- Environmental incidents table - organization-based isolation
CREATE POLICY tenant_isolation_environmental_incidents ON environmental_incidents
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Spill reports table - organization-based isolation via environmental incidents
CREATE POLICY tenant_isolation_spill_reports ON spill_reports
  FOR ALL TO application_role
  USING (environmental_incident_id IN (
    SELECT id FROM environmental_incidents WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
  ));

-- Regulatory filings table - organization-based isolation
CREATE POLICY tenant_isolation_regulatory_filings ON regulatory_filings
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Compliance schedules table - organization-based isolation
CREATE POLICY tenant_isolation_compliance_schedules ON compliance_schedules
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Update wells status default (from original migration)
ALTER TABLE "wells" ALTER COLUMN "status" SET DEFAULT 'active';