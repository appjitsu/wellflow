import { Test, TestingModule } from '@nestjs/testing';

describe('RlsTenantIsolationStrategy', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RlsTenantIsolationStrategy>(/* RlsTenantIsolationStrategy */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
