import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response, NextFunction } from 'express';
import { SecurityHeadersMiddleware } from '../security-headers.middleware';
import { AppConfigService } from '../../config/app.config';

describe('SecurityHeadersMiddleware', () => {
  let middleware: SecurityHeadersMiddleware;
  let mockConfigService: jest.Mocked<AppConfigService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    mockConfigService = {
      nodeEnv: 'development',
    } as jest.Mocked<AppConfigService>;

    mockRequest = {
      path: '/api/test',
      ip: '127.0.0.1',
      headers: {},
      get: jest.fn(
        (headerName: string) =>
          (mockRequest.headers as Record<string, string>)[
            headerName.toLowerCase()
          ],
      ) as any,
    };
    mockResponse = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
    };
    mockNext = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityHeadersMiddleware,
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    middleware = module.get<SecurityHeadersMiddleware>(
      SecurityHeadersMiddleware,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('use', () => {
    it('should set Content Security Policy header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://api.logrocket.com https://cdn.logrocket.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; block-all-mixed-content",
      );
    });

    it('should set X-Frame-Options header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Frame-Options',
        'DENY',
      );
    });

    it('should set X-Content-Type-Options header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff',
      );
    });

    it('should set Referrer-Policy header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin',
      );
    });

    it('should set Permissions-Policy header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=(), ambient-light-sensor=(), autoplay=(), encrypted-media=(), fullscreen=(self), picture-in-picture=()',
      );
    });

    it('should set Strict-Transport-Security header in production', () => {
      (mockConfigService as any).isProduction = true;

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload',
      );
    });

    it('should not set Strict-Transport-Security header in development', () => {
      Object.defineProperty(mockConfigService, 'nodeEnv', {
        get: jest.fn(() => 'development'),
        configurable: true,
      });

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.any(String),
      );
    });

    it('should call next function', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
