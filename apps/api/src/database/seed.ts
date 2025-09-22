import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Database seed script for development environment
 * Creates sample data for testing and development
 */
/* eslint-disable sonarjs/pseudo-random, no-process-env */

async function seed() {
  const dbHost = process.env.DB_HOST || 'localhost';

  const dbPort = parseInt(process.env.DB_PORT || '5432');

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

  // Helper function to generate unique emails for test environments
  const generateUniqueEmail = (baseEmail: string): string => {
    const isTestEnv =
      process.env.NODE_ENV === 'test' || dbName?.includes('test');
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
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `42329${timestamp}${random}`.slice(0, 14);
  };

  // Helper function to generate random names for test environments
  const generateRandomName = (baseName: string): string => {
    const isTestEnv =
      process.env.NODE_ENV === 'test' || dbName?.includes('test');
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

    console.log('✅ Created organization:', organization.name);

    // Create sample users
    const users = await db
      .insert(schema.users)
      .values([
        {
          organizationId: organization.id,
          email: generateUniqueEmail('owner@permianbasinoil.com'),
          firstName: generateRandomName('John'),
          lastName: generateRandomName('Smith'),
          role: 'owner' as const,
          phone: '(432) 555-0123',
          isActive: true,
        },
        {
          organizationId: organization.id,
          email: generateUniqueEmail('manager@permianbasinoil.com'),
          firstName: generateRandomName('Sarah'),
          lastName: generateRandomName('Johnson'),
          role: 'manager' as const,
          phone: '(432) 555-0456',
          isActive: true,
        },
        {
          organizationId: organization.id,
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

    console.log('✅ Created users:', users.length);

    // Create sample lease
    const [lease] = await db
      .insert(schema.leases)
      .values({
        organizationId: organization.id,
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
        status: 'ACTIVE',
      })
      .returning();

    if (!lease) {
      throw new Error('Failed to create lease');
    }

    console.log('✅ Created lease:', lease.name);

    // Create sample wells
    const wells = await db
      .insert(schema.wells)
      .values([
        {
          organizationId: organization.id,
          leaseId: lease.id,
          wellName: 'Smith Ranch #1H',
          apiNumber: generateUniqueApiNumber(),
          wellType: 'OIL',
          status: 'ACTIVE',
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
          organizationId: organization.id,
          leaseId: lease.id,
          wellName: 'Smith Ranch #2H',
          apiNumber: generateUniqueApiNumber(),
          wellType: 'OIL',
          status: 'ACTIVE',
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

    console.log('✅ Created wells:', wells.length);

    // Create sample production records for the last 7 days
    const productionRecords = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      for (const well of wells) {
        productionRecords.push({
          organizationId: organization.id,
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
    console.log('✅ Created production records:', productionRecords.length);

    // Create sample partner
    const [partner] = await db
      .insert(schema.partners)
      .values({
        organizationId: organization.id,
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

    console.log('✅ Created partner:', partner.partnerName);

    // Create lease partner relationship
    await db.insert(schema.leasePartners).values({
      leaseId: lease.id,
      partnerId: partner.id,
      workingInterestPercent: '0.7500', // 75% working interest
      royaltyInterestPercent: '0.1250', // 12.5% royalty
      netRevenueInterestPercent: '0.6563', // 75% - (75% * 12.5%) = 65.625%
      effectiveDate: '2020-01-01',
      isOperator: true,
    });

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
    await pool.end();
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
