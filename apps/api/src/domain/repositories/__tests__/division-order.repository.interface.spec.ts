import { Test, TestingModule } from '@nestjs/testing';

describe('division-order.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<division-order.repository.interface>(/* division-order.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

