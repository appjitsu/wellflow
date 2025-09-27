import { Test, TestingModule } from '@nestjs/testing';

describe('RetryService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<RetryService>(/* RetryService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
