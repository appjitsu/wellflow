import { Test, TestingModule } from '@nestjs/testing';

describe('GetChainOfTitleByLeaseQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetChainOfTitleByLeaseQuery>(/* GetChainOfTitleByLeaseQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
