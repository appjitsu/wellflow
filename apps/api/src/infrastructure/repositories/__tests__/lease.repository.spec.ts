import { Test, TestingModule } from '@nestjs/testing';

describe('LeaseRepository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<LeaseRepository>(/* LeaseRepository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
