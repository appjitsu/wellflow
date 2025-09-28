import { Test, TestingModule } from '@nestjs/testing';
import { LogRocketService } from '../logrocket.service';
import { AppConfigService } from '../../config/app.config';
import LogRocket from 'logrocket';

// Mock LogRocket
jest.mock('logrocket', () => ({
  init: jest.fn(),
  identify: jest.fn(),
  track: jest.fn(),
  log: jest.fn(),
  captureException: jest.fn(),
  getSessionURL: jest.fn((callback) => callback('mock-session-url')),
  addTag: jest.fn(),
}));

describe('LogRocketService', () => {
  let service: LogRocketService;
  let mockConfigService: jest.Mocked<AppConfigService>;

  beforeEach(async () => {
    // Create mock config service
    mockConfigService = {
      logRocketAppId: 'test-app-id',
      nodeEnv: 'test',
    } as jest.Mocked<AppConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogRocketService,
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LogRocketService>(LogRocketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize LogRocket when app ID is provided', () => {
    expect(service.isReady()).toBe(true);
  });

  it('should identify user', () => {
    const userId = 'test-user-123';
    const userInfo = { email: 'test@example.com' };

    service.identify(userId, userInfo);

    expect(LogRocket.identify).toHaveBeenCalledWith(userId, {
      ...userInfo,
      server: true,
      environment: 'test',
      timestamp: expect.any(String),
    });
  });

  it('should track events', () => {
    const eventName = 'test-event';
    const properties = { key: 'value' };

    service.track(eventName, properties);

    expect(LogRocket.track).toHaveBeenCalledWith(eventName, {
      ...properties,
      server: true,
      environment: 'test',
      timestamp: expect.any(String),
    });
  });

  it('should log messages', () => {
    const message = 'test message';
    const level = 'info';
    const extra = { key: 'value' };

    service.log(message, level, extra);

    expect(LogRocket.log).toHaveBeenCalledWith(message, {
      level,
      ...extra,
      server: true,
      environment: 'test',
      timestamp: expect.any(String),
    });
  });

  it('should capture exceptions', () => {
    const error = new Error('test error');
    const extra = { key: 'value' };

    service.captureException(error, extra);

    expect(LogRocket.captureException).toHaveBeenCalledWith(error);
  });

  it('should get session URL', async () => {
    const sessionURL = await service.getSessionURL();

    expect(sessionURL).toBe('mock-session-url');
  });

  it('should add tags', () => {
    const key = 'test-key';
    const value = 'test-value';

    service.addTag(key, value);

    expect(LogRocket.track).toHaveBeenCalledWith('Tag Added', {
      tagKey: key,
      tagValue: value,
      server: true,
      environment: 'test',
      timestamp: expect.any(String),
    });
  });
});
