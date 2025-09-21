import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Database seed script for development environment
 * Creates sample data for testing and development
 */

async function seed() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'wellflow',
  });

  const db = drizzle(pool, { schema });

  try {
    console.log('🌱 Starting database seed...');

    // Create sample organization
    const [organization] = await db
      .insert(schema.organizations)
      .values({
        name: 'Permian Basin Oil Co.',
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
          email: 'owner@permianbasinoil.com',
          firstName: 'John',
          lastName: 'Smith',
          role: 'owner',
          passwordHash: '$2b$10$example.hash.for.development', // In real app, use proper bcrypt hash
          isActive: true,
        },
        {
          organizationId: organization.id,
          email: 'manager@permianbasinoil.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: 'manager',
          passwordHash: '$2b$10$example.hash.for.development',
          isActive: true,
        },
        {
          organizationId: organization.id,
          email: 'pumper@permianbasinoil.com',
          firstName: 'Mike',
          lastName: 'Wilson',
          role: 'pumper',
          passwordHash: '$2b$10$example.hash.for.development',
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
        leaseName: 'Smith Ranch Unit',
        leaseNumber: 'SRU-001',
        legalDescription: {
          section: '15',
          township: '2S',
          range: '40E',
          county: 'Midland',
          state: 'TX',
          description:
            'Section 15, Township 2 South, Range 40 East, Midland County, Texas',
        },
        surfaceLocation: {
          latitude: 32.0853,
          longitude: -102.0779,
        },
        leaseStartDate: '2020-01-01',
        leaseEndDate: '2025-12-31',
        totalAcres: '640.00',
        status: 'active',
      })
      .returning();

    if (!lease) {
      throw new Error('Failed to create lease');
    }

    console.log('✅ Created lease:', lease.leaseName);

    // Create sample wells
    const wells = await db
      .insert(schema.wells)
      .values([
        {
          organizationId: organization.id,
          leaseId: lease.id,
          wellName: 'Smith Ranch #1H',
          apiNumber: '42329123450001', // 14-digit API number for Texas
          surfaceLocation: {
            latitude: 32.0853,
            longitude: -102.0779,
          },
          bottomHoleLocation: {
            latitude: 32.0845,
            longitude: -102.0785,
          },
          totalDepth: '8500.00',
          spudDate: '2020-03-15',
          completionDate: '2020-05-20',
          status: 'producing',
          wellConfiguration: {
            wellType: 'horizontal',
            casingSize: '5.5',
            tubingSize: '2.875',
            perforations: [
              { top: 8200, bottom: 8300 },
              { top: 8350, bottom: 8450 },
            ],
          },
        },
        {
          organizationId: organization.id,
          leaseId: lease.id,
          wellName: 'Smith Ranch #2H',
          apiNumber: '42329123450002',
          surfaceLocation: {
            latitude: 32.086,
            longitude: -102.0775,
          },
          bottomHoleLocation: {
            latitude: 32.0852,
            longitude: -102.0781,
          },
          totalDepth: '8750.00',
          spudDate: '2020-06-01',
          completionDate: '2020-08-15',
          status: 'producing',
          wellConfiguration: {
            wellType: 'horizontal',
            casingSize: '5.5',
            tubingSize: '2.875',
            perforations: [
              { top: 8300, bottom: 8400 },
              { top: 8450, bottom: 8550 },
            ],
          },
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
          wellId: well.id,
          createdByUserId: users[2]!.id, // Pumper user
          productionDate: dateString as string, // Ensure it's typed as string
          oilVolume: (Math.random() * 50 + 25).toFixed(2), // 25-75 barrels
          gasVolume: (Math.random() * 500 + 250).toFixed(2), // 250-750 MCF
          waterVolume: (Math.random() * 20 + 5).toFixed(2), // 5-25 barrels
          oilPrice: '75.50',
          gasPrice: '3.25',
          equipmentReadings: {
            casingPressure: Math.floor(Math.random() * 100 + 200),
            tubingPressure: Math.floor(Math.random() * 50 + 150),
            chokeSize: '12/64',
          },
          notes: i === 0 ? 'Normal operations' : null,
          isEstimated: false,
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
      workingInterestPercent: '75.0000', // 75% working interest
      royaltyInterestPercent: '12.5000', // 12.5% royalty
      netRevenueInterestPercent: '65.6250', // 75% - (75% * 12.5%) = 65.625%
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
