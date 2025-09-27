import { Test, TestingModule } from '@nestjs/testing';

describe('ProductionModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ProductionModule>(/* ProductionModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
