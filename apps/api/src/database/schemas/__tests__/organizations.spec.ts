import { Test, TestingModule } from '@nestjs/testing';

describe('organizations', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<organizations>(/* organizations */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
