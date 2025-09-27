import { Test, TestingModule } from '@nestjs/testing';

describe('VersionInterceptor', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<VersionInterceptor>(/* VersionInterceptor */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
