import { Test, TestingModule } from '@nestjs/testing';

describe('AfeDomainRepository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<AfeDomainRepository>(/* AfeDomainRepository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
