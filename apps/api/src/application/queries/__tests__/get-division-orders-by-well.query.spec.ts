import { Test, TestingModule } from '@nestjs/testing';

describe('GetDivisionOrdersByWellQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDivisionOrdersByWellQuery>(/* GetDivisionOrdersByWellQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
