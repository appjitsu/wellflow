import { Test, TestingModule } from '@nestjs/testing';

describe('throttler.config', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<throttler.config>(/* throttler.config */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
