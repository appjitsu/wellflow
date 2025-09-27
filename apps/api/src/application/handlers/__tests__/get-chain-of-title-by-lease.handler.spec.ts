import { Test, TestingModule } from '@nestjs/testing';

describe('GetChainOfTitleByLeaseHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetChainOfTitleByLeaseHandler>(/* GetChainOfTitleByLeaseHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
