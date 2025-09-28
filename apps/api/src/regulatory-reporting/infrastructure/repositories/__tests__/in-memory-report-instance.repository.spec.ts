import { Test, TestingModule } from '@nestjs/testing';
import { InMemoryReportInstanceRepository } from '../in-memory-report-instance.repository';

describe('InMemoryReportInstanceRepository', () => {
  let service: InMemoryReportInstanceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InMemoryReportInstanceRepository],
    }).compile();

    service = module.get<InMemoryReportInstanceRepository>(
      InMemoryReportInstanceRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
