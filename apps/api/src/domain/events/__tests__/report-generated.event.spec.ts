import { Test, TestingModule } from '@nestjs/testing';
import { ReportGeneratedEvent } from '../report-generated.event';

describe('ReportGeneratedEvent', () => {
  let event: ReportGeneratedEvent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportGeneratedEvent],
    }).compile();

    event = module.get<ReportGeneratedEvent>(ReportGeneratedEvent);
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });
});
