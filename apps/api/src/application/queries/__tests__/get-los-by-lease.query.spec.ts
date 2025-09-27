import { Test, TestingModule } from '@nestjs/testing';

describe('GetLosByLeaseQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetLosByLeaseQuery>(/* GetLosByLeaseQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
