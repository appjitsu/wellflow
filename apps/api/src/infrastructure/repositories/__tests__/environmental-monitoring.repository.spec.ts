import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentalMonitoringRepositoryImpl } from '../environmental-monitoring.repository';
import { DatabaseService } from '../../../database/database.service';

describe('EnvironmentalMonitoringRepositoryImpl', () => {
  let service: EnvironmentalMonitoringRepositoryImpl;

  beforeEach(async () => {
    const mockDatabaseService = {
      getDb: jest.fn().mockReturnValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentalMonitoringRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<EnvironmentalMonitoringRepositoryImpl>(
      EnvironmentalMonitoringRepositoryImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
