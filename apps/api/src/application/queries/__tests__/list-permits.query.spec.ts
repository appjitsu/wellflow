import { Test, TestingModule } from '@nestjs/testing';

describe('ListPermitsQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ListPermitsQuery>(/* ListPermitsQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
