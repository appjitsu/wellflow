import { Test, TestingModule } from '@nestjs/testing';

describe('base.repository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<base.repository>(/* base.repository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
