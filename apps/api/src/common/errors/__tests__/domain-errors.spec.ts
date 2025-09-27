import { Test, TestingModule } from '@nestjs/testing';

describe('WellNotFoundError', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<WellNotFoundError>(/* WellNotFoundError */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
