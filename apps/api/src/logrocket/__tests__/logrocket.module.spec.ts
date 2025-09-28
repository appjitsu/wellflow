import { Test, TestingModule } from '@nestjs/testing';
import { LogRocketService } from '../logrocket.service';
import { AppConfigService } from '../../config/app.config';

describe('LogRocketService', () => {
  let service: LogRocketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogRocketService,
        {
          provide: AppConfigService,
          useValue: {
            get: jest.fn(),
            isProduction: jest.fn(),
            getLogRocketConfig: jest.fn(),
            logRocketAppId: 'test-app-id',
            nodeEnv: 'test',
          },
        },
      ],
    }).compile();

    service = module.get<LogRocketService>(LogRocketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
