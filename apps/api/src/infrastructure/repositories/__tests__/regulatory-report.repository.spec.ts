import { Test, TestingModule } from '@nestjs/testing';
import { RegulatoryReportRepositoryImpl } from '../regulatory-report.repository';
import { DatabaseService } from '../../../database/database.service';

describe('RegulatoryReportRepositoryImpl', () => {
  let service: RegulatoryReportRepositoryImpl;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegulatoryReportRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: {
            getDb: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RegulatoryReportRepositoryImpl>(
      RegulatoryReportRepositoryImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
