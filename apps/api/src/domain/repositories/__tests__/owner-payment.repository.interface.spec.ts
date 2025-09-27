import { Test, TestingModule } from '@nestjs/testing';

describe('owner-payment.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<owner-payment.repository.interface>(/* owner-payment.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

