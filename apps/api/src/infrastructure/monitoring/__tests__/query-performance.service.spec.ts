import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QueryPerformanceService } from '../query-performance.service';

describe('QueryPerformanceService', () => {
  let service: QueryPerformanceService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryPerformanceService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get(QueryPerformanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
