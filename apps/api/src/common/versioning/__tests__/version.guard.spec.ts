import { Test, TestingModule } from '@nestjs/testing';

describe('VersionGuard', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<VersionGuard>(/* VersionGuard */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
