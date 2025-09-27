import { Test, TestingModule } from '@nestjs/testing';

describe('VersionService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<VersionService>(/* VersionService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
