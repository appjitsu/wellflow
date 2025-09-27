import { Test, TestingModule } from '@nestjs/testing';

describe('VendorsController', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<VendorsController>(/* VendorsController */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
