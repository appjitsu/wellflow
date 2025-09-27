import { Test, TestingModule } from '@nestjs/testing';

describe('RegulatoryUnitOfWork', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<RegulatoryUnitOfWork>(/* RegulatoryUnitOfWork */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
