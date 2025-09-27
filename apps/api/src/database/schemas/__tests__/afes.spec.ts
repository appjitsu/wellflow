import { Test, TestingModule } from '@nestjs/testing';

describe('afes', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<afes>(/* afes */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
