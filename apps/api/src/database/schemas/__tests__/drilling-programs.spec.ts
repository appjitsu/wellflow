import { Test, TestingModule } from '@nestjs/testing';

describe('drilling-programs', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<drilling-programs>(/* drilling-programs */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

