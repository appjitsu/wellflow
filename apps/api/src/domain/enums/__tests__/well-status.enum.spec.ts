import { Test, TestingModule } from '@nestjs/testing';

describe('well-status.enum', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<well-status.enum>(/* well-status.enum */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

