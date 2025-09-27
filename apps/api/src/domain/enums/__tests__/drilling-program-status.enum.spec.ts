import { Test, TestingModule } from '@nestjs/testing';

describe('drilling-program-status.enum', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<drilling-program-status.enum>(/* drilling-program-status.enum */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

