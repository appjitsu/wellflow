-- Performance Optimization Indexes Migration
-- KAN-33: Database indexing strategy for <200ms API response time and <50ms database query time
-- This migration adds critical indexes for production queries and performance optimization

-- =============================================================================
-- CRITICAL PRODUCTION INDEXES (as specified in KAN-33)
-- =============================================================================

-- Index for production records queries by well and date
-- Supports queries like: SELECT * FROM production_records WHERE well_id = ? AND production_date BETWEEN ? AND ?
-- This is the most critical index for production data retrieval and reporting
CREATE INDEX IF NOT EXISTS idx_production_records_well_date
ON production_records(well_id, production_date DESC);

-- Index for wells by organization (multi-tenant queries)
-- Supports queries like: SELECT * FROM wells WHERE organization_id = ?
-- Critical for tenant isolation and organization-specific well listings
CREATE INDEX IF NOT EXISTS idx_wells_organization
ON wells(organization_id);

-- Index for API number lookups (unique well identification)
-- Supports queries like: SELECT * FROM wells WHERE api_number = ?
-- Critical for well identification and external system integrations
CREATE INDEX IF NOT EXISTS idx_api_number_lookup
ON wells(api_number);

-- =============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =============================================================================

-- Composite index for production records with organization context
-- Supports complex queries joining wells and production records
CREATE INDEX IF NOT EXISTS idx_production_records_org_well_date
ON production_records(well_id, production_date DESC)
INCLUDE (oil_volume, gas_volume, water_volume);

-- Index for users by organization (authentication and authorization)
-- Supports queries like: SELECT * FROM users WHERE organization_id = ? AND email = ?
CREATE INDEX IF NOT EXISTS idx_users_organization_email
ON users(organization_id, email);

-- Index for leases by organization
-- Supports queries like: SELECT * FROM leases WHERE organization_id = ?
CREATE INDEX IF NOT EXISTS idx_leases_organization
ON leases(organization_id);

-- Index for JIB statements by organization and period
-- Supports queries like: SELECT * FROM jib_statements WHERE organization_id = ? AND statement_period_start = ?
CREATE INDEX IF NOT EXISTS idx_jib_statements_org_period
ON jib_statements(organization_id, statement_period_start);

-- Index for documents by organization and type
-- Supports queries like: SELECT * FROM documents WHERE organization_id = ? AND document_type = ?
CREATE INDEX IF NOT EXISTS idx_documents_org_type
ON documents(organization_id, document_type);

-- Index for equipment by well (for equipment management queries)
-- Supports queries like: SELECT * FROM equipment WHERE well_id = ?
CREATE INDEX IF NOT EXISTS idx_equipment_well
ON equipment(well_id);

-- Index for well tests by well and test date
-- Supports queries like: SELECT * FROM well_tests WHERE well_id = ? ORDER BY test_date DESC
CREATE INDEX IF NOT EXISTS idx_well_tests_well_date
ON well_tests(well_id, test_date DESC);

-- =============================================================================
-- PARTIAL INDEXES FOR ACTIVE RECORDS
-- =============================================================================

-- Partial index for active wells only (most common queries)
-- Reduces index size and improves performance for active well queries
CREATE INDEX IF NOT EXISTS idx_wells_active_organization
ON wells(organization_id, status)
WHERE status = 'active';

-- Note: Skipping compliance_reports indexes as table may not exist in current schema

-- =============================================================================
-- COVERING INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Covering index for well summary queries
-- Includes commonly selected columns to avoid table lookups
CREATE INDEX IF NOT EXISTS idx_wells_summary_covering
ON wells(organization_id, status)
INCLUDE (well_name, api_number, latitude, longitude, created_at);

-- Covering index for production summary queries
-- Includes volume data to avoid table lookups for reporting
CREATE INDEX IF NOT EXISTS idx_production_summary_covering
ON production_records(well_id, production_date DESC)
INCLUDE (oil_volume, gas_volume, water_volume);

-- =============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- =============================================================================

-- Update table statistics for the query planner to make optimal decisions
ANALYZE organizations;
ANALYZE users;
ANALYZE leases;
ANALYZE wells;
ANALYZE production_records;
ANALYZE partners;
ANALYZE lease_partners;
ANALYZE jib_statements;
ANALYZE documents;
ANALYZE equipment;
ANALYZE well_tests;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON INDEX idx_production_records_well_date IS 'Critical index for production data queries by well and date range - KAN-33 performance requirement';
COMMENT ON INDEX idx_wells_organization IS 'Multi-tenant isolation index for wells by organization - KAN-33 performance requirement';
COMMENT ON INDEX idx_api_number_lookup IS 'Unique well identification index for API number lookups - KAN-33 performance requirement';
COMMENT ON INDEX idx_production_records_org_well_date IS 'Composite index for complex production queries with organization context';
COMMENT ON INDEX idx_users_organization_email IS 'Authentication and authorization index for user lookups';
COMMENT ON INDEX idx_wells_active_organization IS 'Partial index for active wells to optimize common queries';
COMMENT ON INDEX idx_wells_summary_covering IS 'Covering index for well summary queries to avoid table lookups';
COMMENT ON INDEX idx_production_summary_covering IS 'Covering index for production summary queries to avoid table lookups';
