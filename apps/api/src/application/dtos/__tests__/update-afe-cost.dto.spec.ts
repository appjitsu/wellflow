import { Test, TestingModule } from '@nestjs/testing';

describe('UpdateAfeCostDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<UpdateAfeCostDto>(/* UpdateAfeCostDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
