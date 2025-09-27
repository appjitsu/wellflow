import { Test, TestingModule } from '@nestjs/testing';

describe('EPARegulatoryACL', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<EPARegulatoryACL>(/* EPARegulatoryACL */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
