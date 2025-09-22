import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Database seed script for development environment
 * Creates sample data for testing and development
 */
/* eslint-disable sonarjs/pseudo-random, no-process-env */

/**
 * Create database connection for seeding
 */
function createDatabaseConnection(): {
  db: ReturnType<typeof drizzle>;
  pool: Pool;
} {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME || 'wellflow';

  const pool = new Pool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  const db = drizzle(pool, { schema });
  return { db, pool };
}

/**
 * Create sample organization
 */
async function createSampleOrganization(db: ReturnType<typeof drizzle>) {
  const [organization] = await db
    .insert(schema.organizations)
    .values({
      name: 'Permian Basin Oil Co.', // eslint-disable-line sonarjs/no-duplicate-string
      taxId: '12-3456789',
      address: {
        street: '123 Oil Field Road',
        city: 'Midland',
        state: 'TX',
        zipCode: '79701',
      },
      phone: '(432) 555-0123',
      email: 'info@permianbasinoil.com',
      settings: {
        timezone: 'America/Chicago',
        currency: 'USD',
        units: 'imperial',
      },
    })
    .returning();

  if (!organization) {
    throw new Error('Failed to create organization');
  }

  return organization;
}

/**
 * Create sample users for an organization
 */
async function createSampleUsers(
  db: ReturnType<typeof drizzle>,
  organizationId: string,
  generateUniqueEmail: (email: string) => string,
  generateRandomName: (name: string) => string,
) {
  const users = await db
    .insert(schema.users)
    .values([
      {
        organizationId,
        email: generateUniqueEmail('owner@permianbasinoil.com'),
        firstName: generateRandomName('John'),
        lastName: generateRandomName('Smith'),
        role: 'owner' as const,
        phone: '(432) 555-0123',
        isActive: true,
      },
      {
        organizationId,
        email: generateUniqueEmail('manager@permianbasinoil.com'),
        firstName: generateRandomName('Sarah'),
        lastName: generateRandomName('Johnson'),
        role: 'manager' as const,
        phone: '(432) 555-0456',
        isActive: true,
      },
      {
        organizationId,
        email: generateUniqueEmail('pumper@permianbasinoil.com'),
        firstName: generateRandomName('Mike'),
        lastName: generateRandomName('Wilson'),
        role: 'pumper' as const,
        phone: '(432) 555-0789',
        isActive: true,
      },
    ])
    .returning();

  if (!users || users.length === 0) {
    throw new Error('Failed to create users');
  }

  return users;
}

/**
 * Create sample lease for an organization
 */
async function createSampleLease(
  db: ReturnType<typeof drizzle>,
  organizationId: string,
) {
  const [lease] = await db
    .insert(schema.leases)
    .values({
      organizationId,
      name: 'Smith Ranch Unit',
      leaseNumber: 'SRU-001',
      lessor: 'Smith Family Trust',
      lessee: 'Permian Basin Oil Co.',
      acreage: '640.0000',
      royaltyRate: '0.1875',
      effectiveDate: '2020-01-01',
      expirationDate: '2025-12-31',
      legalDescription: JSON.stringify({
        section: '15',
        township: '2S',
        range: '40E',
        county: 'Midland',
        state: 'TX',
        description:
          'Section 15, Township 2 South, Range 40 East, Midland County, Texas',
      }),
      status: 'active',
    })
    .returning();

  if (!lease) {
    throw new Error('Failed to create lease');
  }

  return lease;
}

/**
 * Create sample wells for a lease
 */
async function createSampleWells(
  db: ReturnType<typeof drizzle>,
  organizationId: string,
  leaseId: string,
  generateUniqueApiNumber: () => string,
) {
  const wells = await db
    .insert(schema.wells)
    .values([
      {
        organizationId,
        leaseId,
        wellName: 'Smith Ranch #1H',
        apiNumber: generateUniqueApiNumber(),
        wellType: 'OIL',
        status: 'active',
        spudDate: '2020-03-15',
        completionDate: '2020-05-20',
        totalDepth: '8500.00',
        latitude: '32.0853000',
        longitude: '-102.0779000',
        operator: 'Permian Basin Oil Co.',
        field: 'Smith Ranch Field',
        formation: 'Wolfcamp',
      },
      {
        organizationId,
        leaseId,
        wellName: 'Smith Ranch #2H',
        apiNumber: generateUniqueApiNumber(),
        wellType: 'OIL',
        status: 'active',
        spudDate: '2020-06-01',
        completionDate: '2020-08-15',
        totalDepth: '8750.00',
        latitude: '32.0860000',
        longitude: '-102.0785000',
        operator: 'Permian Basin Oil Co.',
        field: 'Smith Ranch Field',
        formation: 'Wolfcamp',
      },
    ])
    .returning();

  if (!wells || wells.length === 0) {
    throw new Error('Failed to create wells');
  }

  return wells;
}

/**
 * Create sample production records for wells
 */
async function createSampleProductionRecords(
  db: ReturnType<typeof drizzle>,
  organizationId: string,
  wells: Array<{ id: string; wellName: string | null }>,
) {
  const productionRecords = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    for (const well of wells) {
      productionRecords.push({
        organizationId,
        wellId: well.id,
        productionDate: dateString as string, // Ensure it's typed as string
        oilVolume: (Math.random() * 50 + 25).toFixed(2), // 25-75 barrels
        gasVolume: (Math.random() * 500 + 250).toFixed(2), // 250-750 MCF
        waterVolume: (Math.random() * 20 + 5).toFixed(2), // 5-25 barrels
        oilPrice: '75.5000',
        gasPrice: '3.2500',
        runTicket: `RT-${dateString}-${well.wellName?.slice(-2)}`,
        comments: i === 0 ? 'Normal operations' : null,
      });
    }
  }

  await db.insert(schema.productionRecords).values(productionRecords);
  return productionRecords;
}

/**
 * Create sample partner and lease partner relationship
 */
async function createSamplePartnerAndRelationship(
  db: ReturnType<typeof drizzle>,
  organizationId: string,
  leaseId: string,
) {
  // Create sample partner
  const [partner] = await db
    .insert(schema.partners)
    .values({
      organizationId,
      partnerName: 'West Texas Royalty LLC',
      partnerCode: 'WTR001',
      taxId: '98-7654321',
      billingAddress: {
        street: '456 Royalty Lane',
        city: 'Odessa',
        state: 'TX',
        zipCode: '79762',
      },
      remitAddress: {
        street: '456 Royalty Lane',
        city: 'Odessa',
        state: 'TX',
        zipCode: '79762',
      },
      contactEmail: 'accounting@wtroyalty.com',
      contactPhone: '(432) 555-0456',
      isActive: true,
    })
    .returning();

  if (!partner) {
    throw new Error('Failed to create partner');
  }

  // Create lease partner relationship
  await db.insert(schema.leasePartners).values({
    leaseId,
    partnerId: partner.id,
    workingInterestPercent: '0.7500', // 75% working interest
    royaltyInterestPercent: '0.1250', // 12.5% royalty
    netRevenueInterestPercent: '0.6563', // 75% - (75% * 12.5%) = 65.625%
    effectiveDate: '2020-01-01',
    isOperator: true,
  });

  return partner;
}

async function seed(externalDb?: ReturnType<typeof drizzle>) {
  let db: ReturnType<typeof drizzle>;
  let pool: Pool | null = null;

  if (externalDb) {
    // Use provided database connection (for tests)
    db = externalDb;
  } else {
    // Create new connection (for standalone execution)
    const connection = createDatabaseConnection();
    db = connection.db;
    pool = connection.pool;
  }

  // Helper function to generate unique emails for test environments
  const generateUniqueEmail = (baseEmail: string): string => {
    const isTestEnv =
      process.env.NODE_ENV === 'test' || process.env.DB_NAME?.includes('test');
    if (isTestEnv) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      const [localPart, domain] = baseEmail.split('@');
      return `${localPart}${timestamp}${random}@${domain}`;
    }
    return baseEmail;
  };

  // Helper function to generate unique API numbers
  const generateUniqueApiNumber = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random1 = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const random2 = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    // Ensure we have exactly 14 digits: 42329 (5) + timestamp (6) + random (8) = 19, then slice to 14
    const apiNumber = `42329${timestamp}${random1}${random2}`;
    return apiNumber.slice(0, 14).padEnd(14, '0');
  };

  // Helper function to generate random names for test environments
  const generateRandomName = (baseName: string): string => {
    const isTestEnv =
      process.env.NODE_ENV === 'test' || process.env.DB_NAME?.includes('test');
    if (isTestEnv) {
      const names = [
        'Smith',
        'Johnson',
        'Williams',
        'Brown',
        'Jones',
        'Garcia',
        'Miller',
        'Davis',
      ];
      return names[Math.floor(Math.random() * names.length)] ?? baseName;
    }
    return baseName;
  };

  try {
    console.log('🌱 Starting database seed...');

    // Create sample organization
    const organization = await createSampleOrganization(db);
    console.log('✅ Created organization:', organization.name);

    // Create sample users
    const users = await createSampleUsers(
      db,
      organization.id,
      generateUniqueEmail,
      generateRandomName,
    );
    console.log('✅ Created users:', users.length);

    // Create sample lease
    const lease = await createSampleLease(db, organization.id);
    console.log('✅ Created lease:', lease.name);

    // Create sample wells
    const wells = await createSampleWells(
      db,
      organization.id,
      lease.id,
      generateUniqueApiNumber,
    );
    console.log('✅ Created wells:', wells.length);

    // Create sample production records for the last 7 days
    const productionRecords = await createSampleProductionRecords(
      db,
      organization.id,
      wells,
    );
    console.log('✅ Created production records:', productionRecords.length);

    // Create sample partner and lease partner relationship
    const partner = await createSamplePartnerAndRelationship(
      db,
      organization.id,
      lease.id,
    );
    console.log('✅ Created partner:', partner.partnerName);
    console.log('✅ Created lease partner relationship');

    console.log('🎉 Database seed completed successfully!');
    console.log(`
📊 Summary:
- Organizations: 1
- Users: 3 (owner, manager, pumper)
- Leases: 1
- Wells: 2
- Production Records: ${productionRecords.length}
- Partners: 1
- Lease Partners: 1
    `);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run seed if called directly
if (require.main === module) {
  seed().catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
}

export default seed;
