import { Test, TestingModule } from '@nestjs/testing';

describe('RejectAfeDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<RejectAfeDto>(/* RejectAfeDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
