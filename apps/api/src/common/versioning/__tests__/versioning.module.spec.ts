import { Test, TestingModule } from '@nestjs/testing';

describe('VersioningModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<VersioningModule>(/* VersioningModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
