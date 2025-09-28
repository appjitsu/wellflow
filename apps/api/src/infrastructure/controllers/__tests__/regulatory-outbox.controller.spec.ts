import { Test, TestingModule } from '@nestjs/testing';
import { RegulatoryOutboxController } from '../regulatory-outbox.controller';
import { RegulatoryOutboxService } from '../../events/regulatory-outbox.service';
import { Reflector } from '@nestjs/core';
import { AbilitiesFactory } from '../../../authorization/abilities.factory';

describe('RegulatoryOutboxController', () => {
  let controller: RegulatoryOutboxController;

  beforeEach(async () => {
    const mockRegulatoryOutboxService = {
      getProcessingStats: jest.fn(),
      retryFailedEvents: jest.fn(),
      processPendingEvents: jest.fn(),
    };

    const mockReflector = {} as any;
    const mockAbilitiesFactory = {} as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegulatoryOutboxController],
      providers: [
        {
          provide: RegulatoryOutboxService,
          useValue: mockRegulatoryOutboxService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: AbilitiesFactory,
          useValue: mockAbilitiesFactory,
        },
      ],
    }).compile();

    controller = module.get<RegulatoryOutboxController>(
      RegulatoryOutboxController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
