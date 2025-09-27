import { Test, TestingModule } from '@nestjs/testing';

describe('UnitOfWork', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<UnitOfWork>(/* UnitOfWork */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
