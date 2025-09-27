import { Test, TestingModule } from '@nestjs/testing';

describe('DistributeLosHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<DistributeLosHandler>(/* DistributeLosHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
