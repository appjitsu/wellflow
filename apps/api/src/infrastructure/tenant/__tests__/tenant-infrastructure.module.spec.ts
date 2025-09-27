import { Test, TestingModule } from '@nestjs/testing';

describe('TenantInfrastructureModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<TenantInfrastructureModule>(/* TenantInfrastructureModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
