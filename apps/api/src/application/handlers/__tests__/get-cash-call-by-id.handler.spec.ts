import { Test, TestingModule } from '@nestjs/testing';

describe('GetCashCallByIdHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetCashCallByIdHandler>(/* GetCashCallByIdHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
