import { Test, TestingModule } from '@nestjs/testing';

describe('joint-operating-agreements', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<joint-operating-agreements>(/* joint-operating-agreements */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

