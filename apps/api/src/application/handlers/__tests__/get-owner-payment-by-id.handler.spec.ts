import { Test, TestingModule } from '@nestjs/testing';

describe('GetOwnerPaymentByIdHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetOwnerPaymentByIdHandler>(/* GetOwnerPaymentByIdHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
