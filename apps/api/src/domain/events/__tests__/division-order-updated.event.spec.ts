import { Test, TestingModule } from '@nestjs/testing';
import { DivisionOrderUpdatedEvent } from '../division-order-updated.event';

describe('DivisionOrderUpdatedEvent', () => {
  let event: DivisionOrderUpdatedEvent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DivisionOrderUpdatedEvent],
    }).compile();

    event = module.get<DivisionOrderUpdatedEvent>(DivisionOrderUpdatedEvent);
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });
});
