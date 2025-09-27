import { Test, TestingModule } from '@nestjs/testing';

describe('vendor-status.enum', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<vendor-status.enum>(/* vendor-status.enum */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

