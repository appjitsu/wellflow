import { Test, TestingModule } from '@nestjs/testing';
import { DivisionOrderDeactivatedEvent } from '../division-order-deactivated.event';

describe('DivisionOrderDeactivatedEvent', () => {
  let service: DivisionOrderDeactivatedEvent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DivisionOrderDeactivatedEvent],
    }).compile();

    service = module.get<DivisionOrderDeactivatedEvent>(
      DivisionOrderDeactivatedEvent,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
