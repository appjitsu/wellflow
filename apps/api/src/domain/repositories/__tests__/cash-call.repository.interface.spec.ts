import { Test, TestingModule } from '@nestjs/testing';

describe('cash-call.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<cash-call.repository.interface>(/* cash-call.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

