import { Test, TestingModule } from '@nestjs/testing';

describe('CreateCashCallDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CreateCashCallDto>(/* CreateCashCallDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
