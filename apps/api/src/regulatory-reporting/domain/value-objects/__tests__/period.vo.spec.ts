import { Test, TestingModule } from '@nestjs/testing';

describe('Period', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<Period>(/* Period */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
