import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../schema';
import { maintenanceSchedules } from '../../schemas/maintenance-schedules';
import { organizations } from '../../schemas/organizations';
import { equipment } from '../../schemas/equipment';
import { vendors } from '../../schemas/vendors';
import { wells } from '../../schemas/wells';
import { MaintenanceScheduleRepository } from '../../../infrastructure/repositories/maintenance-schedule.repository';

const TEST_DB = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433'),
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'please_set_secure_password',
  database: process.env.TEST_DB_NAME || 'wellflow_test',
};

describe('MaintenanceScheduleRepository (db)', () => {
  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;
  let repo: MaintenanceScheduleRepository;

  const ORG1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const ORG2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const WELL1 = '11111111-1111-1111-1111-111111111111';
  const EQ1 = '77777777-7777-7777-7777-777777777771';
  const EQ2 = '77777777-7777-7777-7777-777777777772';
  const V1 = '88888888-8888-8888-8888-888888888881';
  const V2 = '88888888-8888-8888-8888-888888888882';
  const M1 = '99999999-9999-9999-9999-999999999991';
  const M2 = '99999999-9999-9999-9999-999999999992';
  const M3 = '99999999-9999-9999-9999-999999999993';
  const M4 = '99999999-9999-9999-9999-999999999994';

  beforeAll(() => {
    pool = new Pool(TEST_DB);
    db = drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
    repo = new MaintenanceScheduleRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.delete(maintenanceSchedules);
    await db.delete(schema.workovers);
    await db.delete(schema.dailyDrillingReports);
    await db.delete(vendors);
    await db.delete(equipment);
    await db.delete(wells);
    await db.delete(organizations);

    await db.insert(organizations).values([
      { id: ORG1, name: 'Org 1' },
      { id: ORG2, name: 'Org 2' },
    ]);

    await db.insert(wells).values([
      {
        id: WELL1,
        organizationId: ORG1,
        apiNumber: '12345678901234',
        wellName: 'Well 1',
        wellType: 'OIL',
      },
    ]);

    await db.insert(equipment).values([
      {
        id: EQ1,
        wellId: WELL1,
        equipmentName: 'Pump 1',
        equipmentType: 'pump',
      },
      {
        id: EQ2,
        wellId: WELL1,
        equipmentName: 'Pump 2',
        equipmentType: 'pump',
      },
    ]);

    await db.insert(vendors).values([
      {
        id: V1,
        organizationId: ORG1,
        vendorName: 'Vendor 1',
        vendorCode: 'V-1',
        vendorType: 'service',
      },
      {
        id: V2,
        organizationId: ORG2,
        vendorName: 'Vendor 2',
        vendorCode: 'V-2',
        vendorType: 'service',
      },
    ]);
  });

  function row(
    id: string,
    org: string,
    eq: string,
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    updatedAt: Date,
  ) {
    return {
      id,
      organizationId: org,
      equipmentId: eq,
      status,
      createdAt: new Date(updatedAt.getTime() - 1000),
      updatedAt,
    } as const;
  }

  it('filters by organizationId and equipmentId', async () => {
    const now = new Date();
    await db
      .insert(maintenanceSchedules)
      .values([
        row(M1, ORG1, EQ1, 'scheduled', new Date(now.getTime() - 3000)),
        row(M2, ORG1, EQ2, 'in_progress', new Date(now.getTime() - 2000)),
        row(M3, ORG2, EQ2, 'scheduled', new Date(now.getTime() - 1000)),
      ]);

    const allOrg1 = await repo.findByOrganizationId(ORG1);
    const sortIds = (values: readonly string[]) =>
      [...values].sort((a, b) => a.localeCompare(b));
    expect(sortIds(allOrg1.map((m) => m.getId()))).toEqual(sortIds([M1, M2]));

    const byEq = await repo.findByOrganizationId(ORG1, { equipmentId: EQ1 });
    expect(byEq.map((m) => m.getId())).toEqual([M1]);
  });

  it('filters by status and paginates ordered by updatedAt desc', async () => {
    const t0 = new Date();
    await db
      .insert(maintenanceSchedules)
      .values([
        row(M1, ORG1, EQ1, 'scheduled', new Date(t0.getTime() - 5000)),
        row(M2, ORG1, EQ1, 'in_progress', new Date(t0.getTime() - 4000)),
        row(M3, ORG1, EQ1, 'completed', new Date(t0.getTime() - 3000)),
        row(M4, ORG1, EQ1, 'cancelled', new Date(t0.getTime() - 1000)),
      ]);

    const onlyCompleted = await repo.findByOrganizationId(ORG1, {
      status: 'completed',
    });
    expect(onlyCompleted.map((x) => x.getId())).toEqual([M3]);

    const page1 = await repo.findByOrganizationId(ORG1, {
      limit: 2,
      offset: 0,
    });
    const page2 = await repo.findByOrganizationId(ORG1, {
      limit: 2,
      offset: 2,
    });
    expect(page1.map((m) => m.getId())).toEqual([M4, M3]);
    expect(page2.map((m) => m.getId())).toEqual([M2, M1]);
  });
});
