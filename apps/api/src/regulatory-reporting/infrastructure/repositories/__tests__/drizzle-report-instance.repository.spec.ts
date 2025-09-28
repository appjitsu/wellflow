import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleReportInstanceRepository } from '../drizzle-report-instance.repository';
import { DatabaseService } from '../../../../database/database.service';

describe('DrizzleReportInstanceRepository', () => {
  let service: DrizzleReportInstanceRepository;

  beforeEach(async () => {
    const mockDatabaseService = {} as jest.Mocked<DatabaseService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrizzleReportInstanceRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get(DrizzleReportInstanceRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
