import { Test, TestingModule } from '@nestjs/testing';
import { AfeStatusChangedEvent } from '../afe-status-changed.event';

describe('AfeStatusChangedEvent', () => {
  let event: AfeStatusChangedEvent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AfeStatusChangedEvent],
    }).compile();

    event = module.get<AfeStatusChangedEvent>(AfeStatusChangedEvent);
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });
});
