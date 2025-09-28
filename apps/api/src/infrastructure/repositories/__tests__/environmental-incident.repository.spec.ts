import { DrizzleEnvironmentalIncidentRepository } from '../environmental-incident.repository';
import { EnvironmentalIncident } from '../../../domain/entities/environmental-incident.entity';
import {
  IncidentSeverity,
  IncidentType,
} from '../../../domain/enums/environmental-incident.enums';

// eslint-disable-next-line no-secrets/no-secrets
describe('DrizzleEnvironmentalIncidentRepository', () => {
  function makeIncident() {
    return new EnvironmentalIncident({
      id: '11111111-1111-1111-1111-111111111111',
      organizationId: 'org-1',
      reportedByUserId: 'user-1',
      incidentNumber: 'INC-100',
      incidentType: IncidentType.SPILL,
      incidentDate: new Date('2024-02-01'),
      discoveryDate: new Date('2024-02-02'),
      location: 'Pad B',
      description: 'desc',
      severity: IncidentSeverity.MEDIUM,
    });
  }

  it('save() maps dates/decimals/jsonb properly', async () => {
    // Arrange a minimal chainable stub for db.insert(...).values(...).onConflictDoUpdate(...)
    const captured: any[] = [];
    const values = (payload: unknown) => {
      captured.push(payload);
      return { onConflictDoUpdate: () => Promise.resolve() } as any;
    };
    const dbStub: any = { insert: () => ({ values }) };
    const dbService: any = { getDb: () => dbStub };
    const repo = new DrizzleEnvironmentalIncidentRepository(dbService);

    // Act
    const inc = makeIncident();
    await repo.save(inc);

    // Assert
    expect(captured).toHaveLength(1);
    const row = captured[0] as Record<string, unknown>;
    expect(row.incidentDate).toBe('2024-02-01');
    expect(row.discoveryDate).toBe('2024-02-02');
    // estimatedVolume is undefined by default, ensure type compatibility
    expect(
      row.estimatedVolume === undefined ||
        typeof row.estimatedVolume === 'string',
    ).toBe(true);
    // remediationActions should be an array jsonb
    expect(Array.isArray(row.remediationActions as unknown[])).toBe(true);
  });

  it('list() returns domain incidents and total using stubbed rows', async () => {
    // Arrange rows to return
    const rows = [
      {
        id: 'id-1',
        organizationId: 'org',
        reportedByUserId: 'user',
        incidentNumber: 'INC-1',
        incidentType: 'spill',
        incidentDate: '2024-01-10',
        discoveryDate: '2024-01-11',
        location: 'X',
        description: 'd',
        severity: 'low',
        status: 'open',
        regulatoryNotification: false,
        remediationActions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const select = jest.fn().mockReturnValue(rows);
    const from = () => ({
      where: () => ({
        orderBy: () => ({ limit: () => ({ offset: () => select() }) }),
      }),
    });

    const totalSelect = jest.fn().mockReturnValue([{ total: 1 }]);
    const totalFrom = () => ({ where: () => totalSelect() });

    const dbStub: any = {
      select: jest.fn().mockReturnValue({ from }),
      from: jest.fn(),
    };
    // The repository builds two separate promises using select().from() chains
    (dbStub.select as jest.Mock)
      .mockImplementationOnce(() => ({ from }))
      .mockImplementationOnce(() => ({ from: totalFrom }));

    const dbService: any = { getDb: () => dbStub };
    const repo = new DrizzleEnvironmentalIncidentRepository(dbService);

    const result = await repo.list({
      organizationId: 'org',
      limit: 10,
      offset: 0,
    });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toBeDefined();
    expect(result.items[0]!.getId()).toBe('id-1');
  });
});
