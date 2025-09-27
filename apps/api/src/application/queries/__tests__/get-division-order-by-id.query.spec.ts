import { Test, TestingModule } from '@nestjs/testing';

describe('GetDivisionOrderByIdQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDivisionOrderByIdQuery>(/* GetDivisionOrderByIdQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
