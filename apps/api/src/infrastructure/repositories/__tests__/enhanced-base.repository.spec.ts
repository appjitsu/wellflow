import { Test, TestingModule } from '@nestjs/testing';

describe('enhanced-base.repository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<enhanced-base.repository>(/* enhanced-base.repository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

