import { Test, TestingModule } from '@nestjs/testing';

describe('los-status.enum', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<los-status.enum>(/* los-status.enum */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

