import { Test, TestingModule } from '@nestjs/testing';

describe('index', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<index>(/* index */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
