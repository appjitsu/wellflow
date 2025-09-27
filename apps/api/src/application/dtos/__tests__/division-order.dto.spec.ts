import { Test, TestingModule } from '@nestjs/testing';

describe('DivisionOrderDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<DivisionOrderDto>(/* DivisionOrderDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
