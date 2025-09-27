import { Test, TestingModule } from '@nestjs/testing';

describe('GetOwnerPaymentByIdQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetOwnerPaymentByIdQuery>(/* GetOwnerPaymentByIdQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
