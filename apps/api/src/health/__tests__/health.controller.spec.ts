import { Test, TestingModule } from '@nestjs/testing';

describe('HealthController', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<HealthController>(/* HealthController */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
