import { Test, TestingModule } from '@nestjs/testing';

describe('TenantIsolationDomainService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<TenantIsolationDomainService>(/* TenantIsolationDomainService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
