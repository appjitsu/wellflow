import { Test, TestingModule } from '@nestjs/testing';
import { BullMQConfigService } from '../bullmq-config.service';
import { ConfigService } from '@nestjs/config';

describe('BullMQConfigService', () => {
  let service: BullMQConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BullMQConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BullMQConfigService>(BullMQConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
