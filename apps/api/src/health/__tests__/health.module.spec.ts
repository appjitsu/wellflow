import { Test, TestingModule } from '@nestjs/testing';

describe('HealthModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<HealthModule>(/* HealthModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
