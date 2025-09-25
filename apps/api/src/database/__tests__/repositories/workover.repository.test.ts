import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../schema';
import { workovers } from '../../schemas/workovers';
import { organizations } from '../../schemas/organizations';
import { wells } from '../../schemas/wells';
import { WorkoverRepository } from '../../../infrastructure/repositories/workover.repository';
import { WorkoverStatus } from '../../../domain/enums/workover-status.enum';

const TEST_DB = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433'),
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'please_set_secure_password',
  database: process.env.TEST_DB_NAME || 'wellflow_test',
};

describe('WorkoverRepository (db)', () => {
  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;
  let repo: WorkoverRepository;

  beforeAll(() => {
    pool = new Pool(TEST_DB);
    db = drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
    repo = new WorkoverRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Clear dependent tables in order
    await db.delete(workovers);
    await db.delete(schema.drillingPrograms);
    await db.delete(wells);
    await db.delete(organizations);

    // Seed orgs
    await db.insert(organizations).values([
      { id: ORG1, name: 'Org 1' },
      { id: ORG2, name: 'Org 2' },
    ]);

    // Seed wells
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

  const ORG1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const ORG2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const WELL1 = '11111111-1111-1111-1111-111111111111';
  const WELL2 = '22222222-2222-2222-2222-222222222222';
  const WELL3 = '33333333-3333-3333-3333-333333333333';
  const W1 = '55555555-5555-5555-5555-555555555551';
  const W2 = '55555555-5555-5555-5555-555555555552';
  const W3 = '55555555-5555-5555-5555-555555555553';
  const W4 = '55555555-5555-5555-5555-555555555554';
  const W5 = '55555555-5555-5555-5555-555555555555';

  const sortIds = (values: readonly string[]) =>
    [...values].sort((a, b) => a.localeCompare(b));

  function row(
    id: string,
    org: string,
    well: string,
    status: WorkoverStatus,
    updatedAt: Date,
  ) {
    return {
      id,
      organizationId: org,
      wellId: well,
      afeId: null,
      reason: 'test',
      status,
      startDate: null,
      endDate: null,
      estimatedCost: null,
      actualCost: null,
      preProduction: null,
      postProduction: null,
      createdAt: new Date(updatedAt.getTime() - 1000),
      updatedAt,
    } as const;
  }

  it('filters by organizationId and status', async () => {
    const now = new Date();
    await db
      .insert(workovers)
      .values([
        row(
          W1,
          ORG1,
          WELL1,
          WorkoverStatus.PLANNED,
          new Date(now.getTime() - 3000),
        ),
        row(
          W2,
          ORG1,
          WELL2,
          WorkoverStatus.IN_PROGRESS,
          new Date(now.getTime() - 2000),
        ),
        row(
          W3,
          ORG2,
          WELL3,
          WorkoverStatus.PLANNED,
          new Date(now.getTime() - 1000),
        ),
      ]);

    const allOrg1 = await repo.findByOrganizationId(ORG1);
    const sortIds = (values: readonly string[]) =>
      [...values].sort((a, b) => a.localeCompare(b));
    expect(sortIds(allOrg1.map((w) => w.getId()))).toEqual(sortIds([W1, W2]));

    const onlyInProgress = await repo.findByOrganizationId(ORG1, {
      status: WorkoverStatus.IN_PROGRESS,
    });
    expect(onlyInProgress).toHaveLength(1);
    expect(onlyInProgress[0]?.getId()).toBe(W2);
  });

  it('filters by wellId within organization', async () => {
    const now = new Date();
    await db
      .insert(workovers)
      .values([
        row(
          W1,
          ORG1,
          WELL1,
          WorkoverStatus.PLANNED,
          new Date(now.getTime() - 3000),
        ),
        row(
          W2,
          ORG1,
          WELL2,
          WorkoverStatus.PLANNED,
          new Date(now.getTime() - 2000),
        ),
        row(
          W3,
          ORG1,
          WELL1,
          WorkoverStatus.PLANNED,
          new Date(now.getTime() - 1000),
        ),
      ]);

    const byWell = await repo.findByOrganizationId(ORG1, { wellId: WELL1 });
    expect(sortIds(byWell.map((w) => w.getId()))).toEqual(sortIds([W1, W3]));
  });

  it('applies pagination (limit/offset) ordered by updatedAt desc', async () => {
    const t0 = new Date();
    await db
      .insert(workovers)
      .values([
        row(
          W1,
          ORG1,
          WELL1,
          WorkoverStatus.PLANNED,
          new Date(t0.getTime() - 5000),
        ),
        row(
          W2,
          ORG1,
          WELL1,
          WorkoverStatus.PLANNED,
          new Date(t0.getTime() - 4000),
        ),
        row(
          W3,
          ORG1,
          WELL1,
          WorkoverStatus.PLANNED,
          new Date(t0.getTime() - 3000),
        ),
        row(
          W4,
          ORG1,
          WELL1,
          WorkoverStatus.PLANNED,
          new Date(t0.getTime() - 2000),
        ),
        row(
          W5,
          ORG1,
          WELL1,
          WorkoverStatus.PLANNED,
          new Date(t0.getTime() - 1000),
        ),
      ]);

    const page1 = await repo.findByOrganizationId(ORG1, {
      limit: 2,
      offset: 0,
    });
    const page2 = await repo.findByOrganizationId(ORG1, {
      limit: 2,
      offset: 2,
    });

    // updatedAt desc => W5, W4, W3, W2, W1
    expect(page1.map((w) => w.getId())).toEqual([W5, W4]);
    expect(page2.map((w) => w.getId())).toEqual([W3, W2]);
  });
});
