import { Test, TestingModule } from '@nestjs/testing';

describe('workover-status.enum', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<workover-status.enum>(/* workover-status.enum */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

