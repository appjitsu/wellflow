import { Test, TestingModule } from '@nestjs/testing';

describe('formation-tops', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<formation-tops>(/* formation-tops */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

