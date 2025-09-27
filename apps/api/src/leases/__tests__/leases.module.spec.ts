import { Test, TestingModule } from '@nestjs/testing';

describe('LeasesModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<LeasesModule>(/* LeasesModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
