import { Test, TestingModule } from '@nestjs/testing';

describe('https.config', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<https.config>(/* https.config */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
