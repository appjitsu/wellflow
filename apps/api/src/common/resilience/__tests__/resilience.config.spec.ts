import { Test, TestingModule } from '@nestjs/testing';

describe('resilience.config', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<resilience.config>(/* resilience.config */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
