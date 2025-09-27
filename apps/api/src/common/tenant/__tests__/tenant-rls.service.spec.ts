import { Test, TestingModule } from '@nestjs/testing';

describe('TenantRlsService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<TenantRlsService>(/* TenantRlsService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
