import { Test, TestingModule } from '@nestjs/testing';

describe('partner.schemas', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<partner.schemas>(/* partner.schemas */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
