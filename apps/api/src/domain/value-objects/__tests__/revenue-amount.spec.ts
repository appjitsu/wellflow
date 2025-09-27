import { Test, TestingModule } from '@nestjs/testing';

describe('RevenueAmount', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<RevenueAmount>(/* RevenueAmount */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
