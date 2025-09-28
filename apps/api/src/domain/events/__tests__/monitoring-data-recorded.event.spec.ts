import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringDataRecordedEvent } from '../monitoring-data-recorded.event';

describe('MonitoringDataRecordedEvent', () => {
  let service: MonitoringDataRecordedEvent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonitoringDataRecordedEvent],
    }).compile();

    service = module.get<MonitoringDataRecordedEvent>(
      MonitoringDataRecordedEvent,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
