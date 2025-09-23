# Multi-Tenant Row Level Security (RLS) Implementation

## Overview

WellFlow implements PostgreSQL Row Level Security (RLS) policies to ensure
complete data isolation between organizations (tenants). This document describes
the implementation, usage patterns, and best practices for working with
multi-tenant data access.

## Architecture

### Components

1. **RLS Policies**: PostgreSQL policies that automatically filter data based on
   organization context
2. **DatabaseService**: Enhanced with organization context management
3. **TenantRlsService**: Integration layer between application and database
   contexts
4. **TenantGuard**: Automatically sets tenant context from authenticated users

### Database Role Management

The system uses a dedicated `application_role` for RLS enforcement:

```sql
-- Application role for RLS policies
CREATE ROLE application_role;
GRANT USAGE ON SCHEMA public TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO application_role;
```

## RLS Policy Implementation

### Enabled Tables

RLS is enabled on all tenant-specific tables:

- `organizations` - Root tenant entity
- `users` - User accounts per organization
- `wells` - Well data per organization
- `production_records` - Production data (via wells)
- `partners` - Business partners per organization
- `documents` - Document storage per organization
- All other business entities with `organization_id`

### Policy Structure

Each table has a `tenant_isolation_*` policy:

```sql
-- Example: Wells table RLS policy
CREATE POLICY tenant_isolation_wells ON wells
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);
```

### Indirect Relationships

Tables without direct `organization_id` use subqueries:

```sql
-- Example: Production records (related via wells)
CREATE POLICY tenant_isolation_production_records ON production_records
  FOR ALL TO application_role
  USING (well_id IN (
    SELECT id FROM wells
    WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
  ));
```

## Usage Patterns

### Setting Organization Context

```typescript
// Set organization context for database operations
await databaseService.setOrganizationContext(organizationId);

// All subsequent queries will be filtered by RLS
const wells = await db.select().from(schema.wells); // Only org wells returned
```

### Using TenantRlsService

```typescript
// Integrated tenant context management
await tenantRlsService.setTenantContext({
  organizationId: 'org-123',
  userId: 'user-456',
  userRole: 'owner',
});

// Run operations within tenant context
await tenantRlsService.runInTenantContext(
  { organizationId: 'org-123' },
  async () => {
    const wells = await db.select().from(schema.wells);
    // Only wells for org-123 returned
  }
);
```

### Automatic Context via Guards

```typescript
@UseGuards(TenantGuard)
@Controller('wells')
export class WellsController {
  // TenantGuard automatically sets context from JWT token
  async getWells() {
    // RLS automatically filters to user's organization
    return await this.db.select().from(schema.wells);
  }
}
```

## Security Guarantees

### Data Isolation

- **Complete Isolation**: Users can only access data from their organization
- **Automatic Filtering**: All queries are automatically filtered by RLS
- **Cross-Tenant Prevention**: Updates/deletes cannot affect other organizations
- **Subquery Protection**: Related data is protected through relationship
  policies

### Role-Based Access

- **Application Role**: All application queries use `application_role`
- **Superuser Bypass**: Only database administrators can bypass RLS
- **Session Variables**: Organization context stored in PostgreSQL session

## Performance Considerations

### Indexing Strategy

Ensure proper indexing for RLS performance:

```sql
-- Primary organization indexes
CREATE INDEX idx_wells_organization ON wells(organization_id);
CREATE INDEX idx_users_organization ON users(organization_id);

-- Composite indexes for common queries
CREATE INDEX idx_wells_org_status ON wells(organization_id, status);
CREATE INDEX idx_wells_org_type ON wells(organization_id, well_type);
```

### Query Optimization

1. **Explicit Filters**: Add explicit WHERE clauses in addition to RLS
2. **Index Usage**: Ensure RLS policies can use existing indexes
3. **Subquery Optimization**: Minimize complex subqueries in policies
4. **Connection Pooling**: Reduce role switching overhead

### Performance Monitoring

- Monitor query execution plans for RLS overhead
- Set up alerts for queries exceeding performance thresholds
- Regularly analyze slow query logs for RLS-related issues

## Development Guidelines

### Service Layer Patterns

```typescript
@Injectable()
export class WellsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tenantRlsService: TenantRlsService
  ) {}

  async findWells(): Promise<Well[]> {
    // RLS automatically applies - no manual filtering needed
    return await this.db.select().from(schema.wells);
  }

  async createWell(wellData: CreateWellDto): Promise<Well> {
    // Organization ID automatically set from context
    const orgId = this.tenantRlsService.getOrganizationId();

    return await this.db
      .insert(schema.wells)
      .values({
        ...wellData,
        organizationId: orgId,
      })
      .returning();
  }
}
```

### Testing Patterns

```typescript
describe('Multi-tenant data access', () => {
  it('should isolate data by organization', async () => {
    // Set context for org1
    await databaseService.setOrganizationContext(org1Id);
    const org1Wells = await db.select().from(schema.wells);

    // Set context for org2
    await databaseService.setOrganizationContext(org2Id);
    const org2Wells = await db.select().from(schema.wells);

    // Verify isolation
    expect(org1Wells).not.toEqual(org2Wells);
  });
});
```

## Migration and Deployment

### Applying RLS Migration

```bash
# Generate and apply RLS migration
cd apps/api
pnpm drizzle-kit generate --name="enable_row_level_security"
pnpm drizzle-kit migrate
```

### Verification Steps

1. **Policy Creation**: Verify all policies are created
2. **Role Permissions**: Confirm application_role has correct permissions
3. **Data Isolation**: Test cross-tenant access prevention
4. **Performance**: Benchmark query performance impact

## Troubleshooting

### Common Issues

1. **No Data Returned**: Check if organization context is set
2. **Permission Denied**: Verify application_role permissions
3. **Performance Issues**: Check index usage and query plans
4. **Context Desync**: Ensure database and application contexts match

### Debugging Commands

```sql
-- Check current role and context
SELECT current_user, current_setting('app.current_organization_id', true);

-- View active RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE schemaname = 'public';

-- Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables WHERE schemaname = 'public';
```

## Best Practices

### Security

1. **Always Use Guards**: Protect all endpoints with TenantGuard
2. **Validate Context**: Verify organization context before operations
3. **Audit Logging**: Log all tenant context changes
4. **Regular Testing**: Continuously test data isolation

### Performance

1. **Index Organization Columns**: Ensure all organization_id columns are
   indexed
2. **Monitor Query Plans**: Regularly check execution plans for RLS overhead
3. **Connection Pooling**: Use connection pooling to reduce context switching
4. **Cache Strategies**: Implement tenant-aware caching patterns

### Development

1. **Consistent Patterns**: Use TenantRlsService for all tenant operations
2. **Error Handling**: Properly handle tenant context errors
3. **Testing Coverage**: Test all multi-tenant scenarios
4. **Documentation**: Document tenant-specific business logic

## Related Documentation

- [Database Schema Documentation](./wellflow-data-models.md)
- [Authentication & Authorization](./auth-implementation.md)
- [API Security Guidelines](./api-security.md)
- [Performance Optimization](./performance-guidelines.md)
