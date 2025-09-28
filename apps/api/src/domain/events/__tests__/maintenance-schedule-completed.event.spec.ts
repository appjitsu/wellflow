import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceScheduleCompletedEvent } from '../maintenance-schedule-completed.event';

describe('MaintenanceScheduleCompletedEvent', () => {
  let service: MaintenanceScheduleCompletedEvent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaintenanceScheduleCompletedEvent],
    }).compile();

    service = module.get<MaintenanceScheduleCompletedEvent>(
      MaintenanceScheduleCompletedEvent,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
