import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PerformanceAlertObserver } from '../performance-alert.observer';
import { AlertService } from '../alert.service';

describe('PerformanceAlertObserver', () => {
  let service: PerformanceAlertObserver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceAlertObserver,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(10),
          },
        },
        {
          provide: AlertService,
          useValue: {
            createAlert: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PerformanceAlertObserver>(PerformanceAlertObserver);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
