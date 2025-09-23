import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response, NextFunction } from 'express';
import { SecurityHeadersMiddleware } from './security-headers.middleware';
import { AppConfigService } from '../../config/app.config';

describe('SecurityHeadersMiddleware', () => {
  let middleware: SecurityHeadersMiddleware;
  let mockConfigService: jest.Mocked<AppConfigService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    mockConfigService = {
      isProduction: false,
    } as jest.Mocked<AppConfigService>;

    mockRequest = {};
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
        "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' data:; " +
          "connect-src 'self' https:; " +
          "frame-ancestors 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self'",
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

    it('should set Referrer Policy header', () => {
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

    it('should set X-XSS-Protection header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-XSS-Protection',
        '1; mode=block',
      );
    });

    it('should set Permissions Policy header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      );
    });

    it('should set Cross-Origin headers', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cross-Origin-Embedder-Policy',
        'require-corp',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cross-Origin-Opener-Policy',
        'same-origin',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cross-Origin-Resource-Policy',
        'same-origin',
      );
    });

    it('should remove server information headers', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(mockResponse.removeHeader).toHaveBeenCalledWith('Server');
    });

    it('should set custom industry compliance headers', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Industry-Compliance',
        'IEC-62443,NIST-CSF,API-1164',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Security-Policy',
        'Critical-Infrastructure',
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

    it('should set HSTS header in production', () => {
      mockConfigService.isProduction = true;

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    });

    it('should not set HSTS header in non-production', () => {
      mockConfigService.isProduction = false;

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

    it('should set all required security headers', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Verify all security headers are set
      const expectedHeaders = [
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'X-XSS-Protection',
        'Permissions-Policy',
        'Cross-Origin-Embedder-Policy',
        'Cross-Origin-Opener-Policy',
        'Cross-Origin-Resource-Policy',
        'X-Industry-Compliance',
        'X-Security-Policy',
      ];

      expectedHeaders.forEach((header) => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          header,
          expect.any(String),
        );
      });
    });

    it('should handle multiple calls correctly', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(mockResponse.setHeader).toHaveBeenCalledTimes(22); // 11 headers * 2 calls
    });

    it('should work with different request objects', () => {
      const req1 = { url: '/api/test' } as Request;
      const req2 = { url: '/api/other', method: 'POST' } as Request;

      middleware.use(req1, mockResponse as Response, mockNext);
      middleware.use(req2, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should work with different response objects', () => {
      const res1 = { setHeader: jest.fn(), removeHeader: jest.fn() };
      const res2 = { setHeader: jest.fn(), removeHeader: jest.fn() };

      middleware.use(mockRequest as Request, res1 as Response, mockNext);
      middleware.use(mockRequest as Request, res2 as Response, mockNext);

      expect(res1.setHeader).toHaveBeenCalled();
      expect(res2.setHeader).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(middleware).toBeDefined();
    });

    it('should be an instance of SecurityHeadersMiddleware', () => {
      expect(middleware).toBeInstanceOf(SecurityHeadersMiddleware);
    });

    it('should have use method', () => {
      expect(typeof middleware.use).toBe('function');
    });
  });

  describe('security compliance', () => {
    it('should implement OWASP security headers', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // OWASP recommended headers
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.any(String),
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Frame-Options',
        'DENY',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-XSS-Protection',
        '1; mode=block',
      );
    });

    it('should implement industry-specific compliance headers', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Industry-Compliance',
        'IEC-62443,NIST-CSF,API-1164',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Security-Policy',
        'Critical-Infrastructure',
      );
    });

    it('should implement cross-origin isolation', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cross-Origin-Embedder-Policy',
        'require-corp',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cross-Origin-Opener-Policy',
        'same-origin',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cross-Origin-Resource-Policy',
        'same-origin',
      );
    });

    it('should remove information disclosure headers', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(mockResponse.removeHeader).toHaveBeenCalledWith('Server');
    });
  });

  describe('production vs non-production behavior', () => {
    it('should behave differently in production vs non-production', () => {
      // Test non-production
      mockConfigService.isProduction = false;
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      const nonProdCallCount = (mockResponse.setHeader as jest.Mock).mock.calls
        .length;

      jest.clearAllMocks();

      // Test production
      mockConfigService.isProduction = true;
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      const prodCallCount = (mockResponse.setHeader as jest.Mock).mock.calls
        .length;

      expect(prodCallCount).toBeGreaterThan(nonProdCallCount);
    });
  });
});
