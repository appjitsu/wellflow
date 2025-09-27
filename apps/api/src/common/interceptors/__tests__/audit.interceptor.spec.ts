import { Test, TestingModule } from '@nestjs/testing';

describe('AuditInterceptor', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<AuditInterceptor>(/* AuditInterceptor */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
