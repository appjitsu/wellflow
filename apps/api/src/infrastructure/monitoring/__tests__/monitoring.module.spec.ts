import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringModule } from '../monitoring.module';
import { QueryPerformanceService } from '../query-performance.service';

describe('MonitoringModule', () => {
  let module: TestingModule;
  let queryPerformanceService: QueryPerformanceService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [MonitoringModule],
    }).compile();

    queryPerformanceService = module.get<QueryPerformanceService>(
      QueryPerformanceService,
    );
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide QueryPerformanceService', () => {
    expect(queryPerformanceService).toBeDefined();
  });
});
