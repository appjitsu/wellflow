import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../schema';
import { drillingPrograms } from '../../schemas/drilling-programs';
import { organizations } from '../../schemas/organizations';
import { wells } from '../../schemas/wells';
import { DrillingProgramRepository } from '../../../infrastructure/repositories/drilling-program.repository';
import { DrillingProgramStatus } from '../../../domain/enums/drilling-program-status.enum';

// Reuse env provided by jest.config.database.js setupFiles (env.ts)
const TEST_DB = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433'),
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'please_set_secure_password',
  database: process.env.TEST_DB_NAME || 'wellflow_test',
};

describe('DrillingProgramRepository (db)', () => {
  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;
  let repo: DrillingProgramRepository;

  beforeAll(() => {
    pool = new Pool(TEST_DB);
    db = drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
    repo = new DrillingProgramRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Clear dependent tables in order
    await db.delete(drillingPrograms);
    await db.delete(schema.workovers);
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
  const P1 = '44444444-4444-4444-4444-444444444441';
  const P2 = '44444444-4444-4444-4444-444444444442';
  const P3 = '44444444-4444-4444-4444-444444444443';
  const P4 = '44444444-4444-4444-4444-444444444444';
  const P5 = '44444444-4444-4444-4444-444444444445';

  const sortIds = (values: readonly string[]) =>
    [...values].sort((a, b) => a.localeCompare(b));

  function row(
    id: string,
    org: string,
    well: string,
    status: DrillingProgramStatus,
    updatedAt: Date,
  ) {
    return {
      id,
      organizationId: org,
      wellId: well,
      afeId: null,
      programName: `Prog ${id}`,
      version: 1,
      status,
      createdAt: new Date(updatedAt.getTime() - 1000),
      updatedAt,
    } as const;
  }

  it('filters by organizationId and status', async () => {
    const now = new Date();
    await db
      .insert(drillingPrograms)
      .values([
        row(
          P1,
          ORG1,
          WELL1,
          DrillingProgramStatus.DRAFT,
          new Date(now.getTime() - 3000),
        ),
        row(
          P2,
          ORG1,
          WELL2,
          DrillingProgramStatus.APPROVED,
          new Date(now.getTime() - 2000),
        ),
        row(
          P3,
          ORG2,
          WELL3,
          DrillingProgramStatus.DRAFT,
          new Date(now.getTime() - 1000),
        ),
      ]);

    const allOrg1 = await repo.findByOrganizationId(ORG1);
    expect(sortIds(allOrg1.map((p) => p.getId()))).toEqual(sortIds([P1, P2]));

    const onlyApproved = await repo.findByOrganizationId(ORG1, {
      status: DrillingProgramStatus.APPROVED,
    });
    expect(onlyApproved).toHaveLength(1);
    expect(onlyApproved[0]?.getId()).toBe(P2);
  });

  it('filters by wellId within organization', async () => {
    const now = new Date();
    await db
      .insert(drillingPrograms)
      .values([
        row(
          P1,
          ORG1,
          WELL1,
          DrillingProgramStatus.DRAFT,
          new Date(now.getTime() - 3000),
        ),
        row(
          P2,
          ORG1,
          WELL2,
          DrillingProgramStatus.DRAFT,
          new Date(now.getTime() - 2000),
        ),
        row(
          P3,
          ORG1,
          WELL1,
          DrillingProgramStatus.DRAFT,
          new Date(now.getTime() - 1000),
        ),
      ]);

    const byWell = await repo.findByOrganizationId(ORG1, { wellId: WELL1 });
    expect(sortIds(byWell.map((p) => p.getId()))).toEqual(sortIds([P1, P3]));
  });

  it('applies pagination (limit/offset) ordered by updatedAt desc', async () => {
    const t0 = new Date();
    await db
      .insert(drillingPrograms)
      .values([
        row(
          P1,
          ORG1,
          WELL1,
          DrillingProgramStatus.DRAFT,
          new Date(t0.getTime() - 5000),
        ),
        row(
          P2,
          ORG1,
          WELL1,
          DrillingProgramStatus.DRAFT,
          new Date(t0.getTime() - 4000),
        ),
        row(
          P3,
          ORG1,
          WELL1,
          DrillingProgramStatus.DRAFT,
          new Date(t0.getTime() - 3000),
        ),
        row(
          P4,
          ORG1,
          WELL1,
          DrillingProgramStatus.DRAFT,
          new Date(t0.getTime() - 2000),
        ),
        row(
          P5,
          ORG1,
          WELL1,
          DrillingProgramStatus.DRAFT,
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

    // updatedAt desc => P5, P4, P3, P2, P1
    expect(page1.map((p) => p.getId())).toEqual([P5, P4]);
    expect(page2.map((p) => p.getId())).toEqual([P3, P2]);
  });
});
