import { Test, TestingModule } from '@nestjs/testing';

describe('MonitoringType', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<MonitoringType>(/* MonitoringType */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
