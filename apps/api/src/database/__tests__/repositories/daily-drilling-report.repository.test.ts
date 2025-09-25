import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../schema';
import { dailyDrillingReports } from '../../schemas/daily-drilling-reports';
import { organizations } from '../../schemas/organizations';
import { wells } from '../../schemas/wells';
import { DailyDrillingReportRepository } from '../../../infrastructure/repositories/daily-drilling-report.repository';

const TEST_DB = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433'),
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'please_set_secure_password',
  database: process.env.TEST_DB_NAME || 'wellflow_test',
};

describe('DailyDrillingReportRepository (db)', () => {
  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;
  let repo: DailyDrillingReportRepository;

  const ORG1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const ORG2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const WELL1 = '11111111-1111-1111-1111-111111111111';
  const WELL2 = '22222222-2222-2222-2222-222222222222';
  const WELL3 = '33333333-3333-3333-3333-333333333333';
  const R1 = '55555555-5555-5555-5555-555555555551';
  const R2 = '55555555-5555-5555-5555-555555555552';
  const R3 = '55555555-5555-5555-5555-555555555553';

  beforeAll(() => {
    pool = new Pool(TEST_DB);
    db = drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
    repo = new DailyDrillingReportRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.delete(dailyDrillingReports);
    await db.delete(schema.workovers);
    await db.delete(schema.equipment);
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
      {
        id: WELL2,
        organizationId: ORG1,
        apiNumber: '22345678901234',
        wellName: 'Well 2',
        wellType: 'GAS',
      },
      {
        id: WELL3,
        organizationId: ORG2,
        apiNumber: '32345678901234',
        wellName: 'Well 3',
        wellType: 'OIL',
      },
    ]);
  });

  function row(id: string, org: string, well: string, reportDate: string) {
    return {
      id,
      organizationId: org,
      wellId: well,
      reportDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as const;
  }

  it('filters by organizationId and wellId', async () => {
    await db
      .insert(dailyDrillingReports)
      .values([
        row(R1, ORG1, WELL1, '2025-01-01'),
        row(R2, ORG1, WELL2, '2025-01-02'),
        row(R3, ORG2, WELL3, '2025-01-03'),
      ]);

    const allOrg1 = await repo.findByOrganizationId(ORG1);
    const sortIds = (values: readonly string[]) =>
      [...values].sort((a, b) => a.localeCompare(b));

    expect(sortIds(allOrg1.map((r) => r.getId()))).toEqual(sortIds([R1, R2]));

    const byWell = await repo.findByOrganizationId(ORG1, { wellId: WELL1 });
    expect(byWell.map((r) => r.getId())).toEqual([R1]);
  });

  it('filters by date range and paginates', async () => {
    await db
      .insert(dailyDrillingReports)
      .values([
        row(R1, ORG1, WELL1, '2025-01-01'),
        row(R2, ORG1, WELL1, '2025-01-02'),
        row(R3, ORG1, WELL1, '2025-01-03'),
      ]);

    const from = new Date('2025-01-02');
    const to = new Date('2025-01-03');

    const filtered = await repo.findByOrganizationId(ORG1, {
      fromDate: from,
      toDate: to,
      limit: 1,
      offset: 0,
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.getId()).toBe(R3); // assumes order by reportDate desc in impl
  });
});
