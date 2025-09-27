import { Test, TestingModule } from '@nestjs/testing';

describe('OwnerPaymentRepository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<OwnerPaymentRepository>(/* OwnerPaymentRepository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
