import { Test, TestingModule } from '@nestjs/testing';

describe('vendor-contacts', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<vendor-contacts>(/* vendor-contacts */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

