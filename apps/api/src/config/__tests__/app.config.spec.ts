import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '../app.config';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Application Configuration', () => {
    describe('port', () => {
      it('should return configured port', () => {
        configService.get.mockReturnValue(8080);
        expect(service.port).toBe(8080);
        expect(configService.get).toHaveBeenCalledWith('PORT', 3001);
      });

      it('should return default port when not configured', () => {
        configService.get.mockReturnValue(3001);
        expect(service.port).toBe(3001);
      });
    });

    describe('nodeEnv', () => {
      it('should return configured NODE_ENV', () => {
        configService.get.mockReturnValue('production');
        expect(service.nodeEnv).toBe('production');
        expect(configService.get).toHaveBeenCalledWith(
          'NODE_ENV',
          'development',
        );
      });

      it('should return default development when not configured', () => {
        configService.get.mockReturnValue('development');
        expect(service.nodeEnv).toBe('development');
      });
    });

    describe('apiUrl', () => {
      it('should return configured API_URL', () => {
        configService.get.mockReturnValue('https://api.example.com');
        expect(service.apiUrl).toBe('https://api.example.com');
        expect(configService.get).toHaveBeenCalledWith('API_URL', '');
      });

      it('should return empty string when not configured', () => {
        configService.get.mockReturnValue('');
        expect(service.apiUrl).toBe('');
      });
    });

    describe('isProduction', () => {
      it('should return true when NODE_ENV is production', () => {
        configService.get.mockReturnValueOnce('production');
        expect(service.isProduction).toBe(true);
      });

      it('should return false when NODE_ENV is not production', () => {
        configService.get.mockReturnValueOnce('development');
        expect(service.isProduction).toBe(false);
      });
    });

    describe('isDevelopment', () => {
      it('should return true when NODE_ENV is development', () => {
        configService.get.mockReturnValueOnce('development');
        expect(service.isDevelopment).toBe(true);
      });

      it('should return false when NODE_ENV is not development', () => {
        configService.get.mockReturnValueOnce('production');
        expect(service.isDevelopment).toBe(false);
      });
    });
  });

  describe('Database Configuration', () => {
    describe('dbHost', () => {
      it('should return configured DB_HOST', () => {
        configService.get.mockReturnValue('db.example.com');
        expect(service.dbHost).toBe('db.example.com');
        expect(configService.get).toHaveBeenCalledWith('DB_HOST', 'localhost');
      });

      it('should return default localhost when not configured', () => {
        configService.get.mockReturnValue('localhost');
        expect(service.dbHost).toBe('localhost');
      });
    });

    describe('dbPort', () => {
      it('should return configured DB_PORT', () => {
        configService.get.mockReturnValue(5432);
        expect(service.dbPort).toBe(5432);
        expect(configService.get).toHaveBeenCalledWith('DB_PORT', 5433);
      });

      it('should return default port when not configured', () => {
        configService.get.mockReturnValue(5433);
        expect(service.dbPort).toBe(5433);
      });
    });

    describe('dbUser', () => {
      it('should return configured DB_USER', () => {
        configService.get.mockReturnValue('wellflow_user');
        expect(service.dbUser).toBe('wellflow_user');
        expect(configService.get).toHaveBeenCalledWith('DB_USER', 'postgres');
      });

      it('should return default postgres when not configured', () => {
        configService.get.mockReturnValue('postgres');
        expect(service.dbUser).toBe('postgres');
      });
    });

    describe('dbPassword', () => {
      it('should return configured DB_PASSWORD', () => {
        configService.get.mockReturnValue('secure_password');
        expect(service.dbPassword).toBe('secure_password');
        expect(configService.get).toHaveBeenCalledWith(
          'DB_PASSWORD',
          'password',
        );
      });

      it('should return default password when not configured', () => {
        configService.get.mockReturnValue('password');
        expect(service.dbPassword).toBe('password');
      });
    });

    describe('dbName', () => {
      it('should return configured DB_NAME', () => {
        configService.get.mockReturnValue('wellflow_prod');
        expect(service.dbName).toBe('wellflow_prod');
        expect(configService.get).toHaveBeenCalledWith('DB_NAME', 'wellflow');
      });

      it('should return default wellflow when not configured', () => {
        configService.get.mockReturnValue('wellflow');
        expect(service.dbName).toBe('wellflow');
      });
    });
  });

  describe('Redis Configuration', () => {
    describe('redisUrl', () => {
      it('should return configured REDIS_URL', () => {
        configService.get.mockReturnValue('redis://redis.example.com:6379');
        expect(service.redisUrl).toBe('redis://redis.example.com:6379');
        expect(configService.get).toHaveBeenCalledWith(
          'REDIS_URL',
          'redis://localhost:6379',
        );
      });

      it('should return default Redis URL when not configured', () => {
        configService.get.mockReturnValue('redis://localhost:6379');
        expect(service.redisUrl).toBe('redis://localhost:6379');
      });
    });
  });

  describe('LogRocket Configuration', () => {
    describe('logRocketAppId', () => {
      it('should return configured LOGROCKET_APP_ID', () => {
        configService.get.mockReturnValue('app_12345');
        expect(service.logRocketAppId).toBe('app_12345');
        expect(configService.get).toHaveBeenCalledWith('LOGROCKET_APP_ID');
      });

      it('should return undefined when not configured', () => {
        configService.get.mockReturnValue(undefined);
        expect(service.logRocketAppId).toBeUndefined();
      });
    });

    describe('logRocketApiKey', () => {
      it('should return configured LOGROCKET_API_KEY', () => {
        configService.get.mockReturnValue('api_key_123');
        expect(service.logRocketApiKey).toBe('api_key_123');
        expect(configService.get).toHaveBeenCalledWith('LOGROCKET_API_KEY');
      });

      it('should return undefined when not configured', () => {
        configService.get.mockReturnValue(undefined);
        expect(service.logRocketApiKey).toBeUndefined();
      });
    });

    describe('logRocketEnabled', () => {
      it('should return true when appId exists and environment is production', () => {
        configService.get.mockImplementation(
          (key: string, defaultValue?: any) => {
            if (key === 'NODE_ENV') return 'production';
            if (key === 'LOGROCKET_APP_ID') return 'app_123';
            return defaultValue;
          },
        );
        expect(service.logRocketEnabled).toBe(true);
      });

      it('should return true when appId exists and environment is development', () => {
        configService.get.mockImplementation(
          (key: string, defaultValue?: any) => {
            if (key === 'NODE_ENV') return 'development';
            if (key === 'LOGROCKET_APP_ID') return 'app_123';
            return defaultValue;
          },
        );
        expect(service.logRocketEnabled).toBe(true);
      });

      it('should return false when appId does not exist', () => {
        configService.get.mockImplementation(
          (key: string, defaultValue?: any) => {
            if (key === 'NODE_ENV') return 'production';
            if (key === 'LOGROCKET_APP_ID') return undefined;
            return defaultValue;
          },
        );
        expect(service.logRocketEnabled).toBe(false);
      });
    });
  });

  describe('Sentry Configuration', () => {
    describe('sentryDsn', () => {
      it('should return configured SENTRY_DSN', () => {
        configService.get.mockReturnValue('https://sentry.example.com/123');
        expect(service.sentryDsn).toBe('https://sentry.example.com/123');
        expect(configService.get).toHaveBeenCalledWith('SENTRY_DSN');
      });

      it('should return undefined when not configured', () => {
        configService.get.mockReturnValue(undefined);
        expect(service.sentryDsn).toBeUndefined();
      });
    });

    describe('sentryEnvironment', () => {
      it('should return configured SENTRY_ENVIRONMENT', () => {
        configService.get.mockImplementation(
          (key: string, defaultValue?: any) => {
            if (key === 'NODE_ENV') return 'development';
            if (key === 'SENTRY_ENVIRONMENT') return 'staging';
            return defaultValue;
          },
        );
        expect(service.sentryEnvironment).toBe('staging');
        expect(configService.get).toHaveBeenCalledWith(
          'SENTRY_ENVIRONMENT',
          'development',
        );
      });

      it('should return nodeEnv when SENTRY_ENVIRONMENT not configured', () => {
        configService.get.mockImplementation(
          (key: string, defaultValue?: any) => {
            if (key === 'NODE_ENV') return 'production';
            // For SENTRY_ENVIRONMENT, don't return anything to simulate not configured
            return defaultValue;
          },
        );
        expect(service.sentryEnvironment).toBe('production');
      });
    });

    describe('sentryEnabled', () => {
      it('should return true when DSN is configured', () => {
        configService.get.mockReturnValue('https://sentry.example.com/123');
        expect(service.sentryEnabled).toBe(true);
      });

      it('should return false when DSN is not configured', () => {
        configService.get.mockReturnValue(undefined);
        expect(service.sentryEnabled).toBe(false);
      });
    });
  });

  describe('Security Configuration', () => {
    describe('jwtSecret', () => {
      it('should return configured JWT_SECRET', () => {
        configService.get.mockReturnValue('my-jwt-secret');
        expect(service.jwtSecret).toBe('my-jwt-secret');
        expect(configService.get).toHaveBeenCalledWith(
          'JWT_SECRET',
          'wellflow-dev-secret',
        );
      });

      it('should return default secret when not configured', () => {
        configService.get.mockReturnValue('wellflow-dev-secret');
        expect(service.jwtSecret).toBe('wellflow-dev-secret');
      });
    });

    describe('jwtExpiresIn', () => {
      it('should return configured JWT_EXPIRES_IN', () => {
        configService.get.mockReturnValue('12h');
        expect(service.jwtExpiresIn).toBe('12h');
        expect(configService.get).toHaveBeenCalledWith('JWT_EXPIRES_IN', '24h');
      });

      it('should return default 24h when not configured', () => {
        configService.get.mockReturnValue('24h');
        expect(service.jwtExpiresIn).toBe('24h');
      });
    });
  });

  describe('Rate Limiting Configuration', () => {
    describe('rateLimitTtl', () => {
      it('should return configured RATE_LIMIT_TTL', () => {
        configService.get.mockReturnValue(30000);
        expect(service.rateLimitTtl).toBe(30000);
        expect(configService.get).toHaveBeenCalledWith('RATE_LIMIT_TTL', 60000);
      });

      it('should return default 60000 when not configured', () => {
        configService.get.mockReturnValue(60000);
        expect(service.rateLimitTtl).toBe(60000);
      });
    });

    describe('rateLimitMax', () => {
      it('should return configured RATE_LIMIT_MAX', () => {
        configService.get.mockReturnValue(100);
        expect(service.rateLimitMax).toBe(100);
        expect(configService.get).toHaveBeenCalledWith('RATE_LIMIT_MAX', 60);
      });

      it('should return default 60 when not configured', () => {
        configService.get.mockReturnValue(60);
        expect(service.rateLimitMax).toBe(60);
      });
    });
  });

  describe('HTTPS Configuration', () => {
    describe('httpsEnabled', () => {
      it('should return configured HTTPS_ENABLED', () => {
        configService.get.mockReturnValue(true);
        expect(service.httpsEnabled).toBe(true);
        expect(configService.get).toHaveBeenCalledWith('HTTPS_ENABLED', false);
      });

      it('should return default false when not configured', () => {
        configService.get.mockReturnValue(false);
        expect(service.httpsEnabled).toBe(false);
      });
    });

    describe('sslKeyPath', () => {
      it('should return configured SSL_KEY_PATH', () => {
        configService.get.mockReturnValue('/path/to/ssl/key.pem');
        expect(service.sslKeyPath).toBe('/path/to/ssl/key.pem');
        expect(configService.get).toHaveBeenCalledWith('SSL_KEY_PATH');
      });

      it('should return undefined when not configured', () => {
        configService.get.mockReturnValue(undefined);
        expect(service.sslKeyPath).toBeUndefined();
      });
    });

    describe('sslCertPath', () => {
      it('should return configured SSL_CERT_PATH', () => {
        configService.get.mockReturnValue('/path/to/ssl/cert.pem');
        expect(service.sslCertPath).toBe('/path/to/ssl/cert.pem');
        expect(configService.get).toHaveBeenCalledWith('SSL_CERT_PATH');
      });

      it('should return undefined when not configured', () => {
        configService.get.mockReturnValue(undefined);
        expect(service.sslCertPath).toBeUndefined();
      });
    });
  });

  describe('Host Configuration', () => {
    describe('host', () => {
      it('should return configured HOST', () => {
        configService.get.mockReturnValue('0.0.0.0');
        expect(service.host).toBe('0.0.0.0');
        expect(configService.get).toHaveBeenCalledWith('HOST', 'localhost');
      });

      it('should return default localhost when not configured', () => {
        configService.get.mockReturnValue('localhost');
        expect(service.host).toBe('localhost');
      });
    });
  });

  describe('Generic Methods', () => {
    describe('get', () => {
      it('should return configured value with default', () => {
        configService.get.mockReturnValue('configured_value');
        expect(service.get('TEST_KEY', 'default')).toBe('configured_value');
        expect(configService.get).toHaveBeenCalledWith('TEST_KEY', 'default');
      });

      it('should return default value when not configured', () => {
        configService.get.mockReturnValue('default');
        expect(service.get('TEST_KEY', 'default')).toBe('default');
      });

      it('should return configured value without default', () => {
        configService.get.mockReturnValue('configured_value');
        expect(service.get('TEST_KEY')).toBe('configured_value');
        expect(configService.get).toHaveBeenCalledWith('TEST_KEY');
      });

      it('should return undefined when not configured and no default', () => {
        configService.get.mockReturnValue(undefined);
        expect(service.get('TEST_KEY')).toBeUndefined();
      });
    });

    describe('getOrThrow', () => {
      it('should return configured value', () => {
        configService.getOrThrow.mockReturnValue('required_value');
        expect(service.getOrThrow('REQUIRED_KEY')).toBe('required_value');
        expect(configService.getOrThrow).toHaveBeenCalledWith('REQUIRED_KEY');
      });

      it('should throw when value is not configured', () => {
        configService.getOrThrow.mockImplementation(() => {
          throw new Error('Configuration key not found');
        });
        expect(() => service.getOrThrow('MISSING_KEY')).toThrow(
          'Configuration key not found',
        );
      });
    });
  });
});
