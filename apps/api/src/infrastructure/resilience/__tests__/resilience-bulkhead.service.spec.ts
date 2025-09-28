import { Test, TestingModule } from '@nestjs/testing';
import { ResilienceBulkhead } from '../resilience-bulkhead.service';

describe('ResilienceBulkhead', () => {
  let service: ResilienceBulkhead;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ResilienceBulkhead,
          useFactory: () =>
            new ResilienceBulkhead({
              name: 'test-bulkhead',
              maxConcurrentCalls: 5,
              maxQueueSize: 10,
              queueTimeoutMs: 15000,
              executionTimeoutMs: 30000,
              monitoringEnabled: false,
            }),
        },
      ],
    }).compile();

    service = module.get<ResilienceBulkhead>(ResilienceBulkhead);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
