import { Test, TestingModule } from '@nestjs/testing';

describe('EnvironmentalMonitoringRepositoryImpl', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<EnvironmentalMonitoringRepositoryImpl>(/* EnvironmentalMonitoringRepositoryImpl */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
