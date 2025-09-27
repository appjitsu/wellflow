import { Test, TestingModule } from '@nestjs/testing';

describe('JibLineItemDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<JibLineItemDto>(/* JibLineItemDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
