import { Test, TestingModule } from '@nestjs/testing';

describe('GetCashCallByIdQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetCashCallByIdQuery>(/* GetCashCallByIdQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
