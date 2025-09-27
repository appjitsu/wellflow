import { Test, TestingModule } from '@nestjs/testing';

describe('CreateOwnerPaymentDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CreateOwnerPaymentDto>(/* CreateOwnerPaymentDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
