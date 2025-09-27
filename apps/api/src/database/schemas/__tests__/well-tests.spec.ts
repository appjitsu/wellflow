import { Test, TestingModule } from '@nestjs/testing';

describe('well-tests', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<well-tests>(/* well-tests */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

