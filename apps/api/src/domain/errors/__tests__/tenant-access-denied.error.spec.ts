import { Test, TestingModule } from '@nestjs/testing';

describe('TenantAccessDeniedError', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<TenantAccessDeniedError>(/* TenantAccessDeniedError */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
