import { Test, TestingModule } from '@nestjs/testing';

describe('lease-operating-statements', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<lease-operating-statements>(/* lease-operating-statements */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

