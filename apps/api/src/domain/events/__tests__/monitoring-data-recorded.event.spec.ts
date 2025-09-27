import { Test, TestingModule } from '@nestjs/testing';

describe('MonitoringDataRecordedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<MonitoringDataRecordedEvent>(/* MonitoringDataRecordedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
