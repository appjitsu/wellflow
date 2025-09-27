import { Test, TestingModule } from '@nestjs/testing';

describe('GetLosByLeaseHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetLosByLeaseHandler>(/* GetLosByLeaseHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
