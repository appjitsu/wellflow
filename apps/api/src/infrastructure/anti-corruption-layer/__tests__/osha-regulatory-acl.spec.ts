import { Test, TestingModule } from '@nestjs/testing';

describe('OSHARegulatoryACL', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<OSHARegulatoryACL>(/* OSHARegulatoryACL */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
