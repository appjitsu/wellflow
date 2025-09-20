import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { SentryExceptionFilter } from './sentry-exception.filter';
import { SentryService } from '../../sentry/sentry.service';

describe('SentryExceptionFilter', () => {
  let filter: SentryExceptionFilter;
  let sentryService: jest.Mocked<SentryService>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(async () => {
    // Mock SentryService
    const mockSentryService = {
      setExtra: jest.fn(),
      captureException: jest.fn(),
      captureMessage: jest.fn(),
    };

    // Mock HTTP context
    mockRequest = {
      method: 'GET',
      url: '/api/test',
      headers: {
        'authorization': 'Bearer token',
        'cookie': 'session=123',
        'x-api-key': 'secret',
        'user-agent': 'test-agent',
      },
      body: { test: 'data' },
      query: { page: '1' },
      params: { id: '123' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const mockHttpContext = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getNext: jest.fn(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SentryExceptionFilter,
        {
          provide: SentryService,
          useValue: mockSentryService,
        },
      ],
    }).compile();

    filter = module.get<SentryExceptionFilter>(SentryExceptionFilter);
    sentryService = module.get(SentryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle HttpException with string response', () => {
      const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/api/test',
        method: 'GET',
        error: 'Internal Server Error', // Default error when string response
        message: 'Bad Request',
      });

      // Should not send to Sentry for 4xx errors (except 401, 403)
      expect(sentryService.captureException).not.toHaveBeenCalled();
      expect(sentryService.captureMessage).not.toHaveBeenCalled();
    });

    it('should handle HttpException with object response', () => {
      const exceptionResponse = {
        message: 'Validation failed',
        error: 'Bad Request',
        statusCode: 400,
      };
      const exception = new HttpException(exceptionResponse, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/api/test',
        method: 'GET',
        error: 'Bad Request',
        message: 'Validation failed',
      });
    });

    it('should handle 401 Unauthorized and send to Sentry', () => {
      const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(sentryService.setExtra).toHaveBeenCalledWith('request', {
        method: 'GET',
        url: '/api/test',
        headers: {
          'user-agent': 'test-agent',
          // Sensitive headers should be removed
        },
        body: { test: 'data' },
        query: { page: '1' },
        params: { id: '123' },
      });
      expect(sentryService.setExtra).toHaveBeenCalledWith('response', {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Internal Server Error', // Default error when string response
      });
      expect(sentryService.captureException).toHaveBeenCalledWith(exception, 'HTTP_EXCEPTION');
    });

    it('should handle 403 Forbidden and send to Sentry', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(sentryService.captureException).toHaveBeenCalledWith(exception, 'HTTP_EXCEPTION');
    });

    it('should handle 500 Internal Server Error and send to Sentry', () => {
      const exception = new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(sentryService.captureException).toHaveBeenCalledWith(exception, 'HTTP_EXCEPTION');
    });

    it('should handle generic Error instances', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        timestamp: expect.any(String),
        path: '/api/test',
        method: 'GET',
        error: 'Error',
        message: 'Something went wrong',
      });
      expect(sentryService.captureException).toHaveBeenCalledWith(exception, 'HTTP_EXCEPTION');
    });

    it('should handle unknown exceptions', () => {
      const exception = 'Unknown error';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        timestamp: expect.any(String),
        path: '/api/test',
        method: 'GET',
        error: 'Internal Server Error',
        message: 'Internal server error',
      });
      expect(sentryService.captureMessage).toHaveBeenCalledWith(
        'HTTP Exception: Internal server error',
        'error',
        'HTTP_EXCEPTION',
      );
    });

    it('should handle null exception response object', () => {
      const exception = new HttpException(null as any, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/api/test',
        method: 'GET',
        error: 'Internal Server Error',
        message: 'Internal server error',
      });
    });

    it('should handle exception response object without message or error fields', () => {
      const exceptionResponse = { statusCode: 400, data: 'some data' };
      const exception = new HttpException(exceptionResponse, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/api/test',
        method: 'GET',
        error: 'Internal Server Error',
        message: 'Internal server error',
      });
    });
  });

  describe('sanitizeHeaders', () => {
    it('should remove sensitive headers', () => {
      const headers = {
        'authorization': 'Bearer token',
        'cookie': 'session=123',
        'x-api-key': 'secret',
        'x-auth-token': 'auth-token',
        'user-agent': 'test-agent',
        'content-type': 'application/json',
      };

      // Access private method through any cast
      const sanitized = (filter as any).sanitizeHeaders(headers);

      expect(sanitized).toEqual({
        'user-agent': 'test-agent',
        'content-type': 'application/json',
      });

      // Ensure original headers are not modified
      expect(headers).toHaveProperty('authorization');
      expect(headers).toHaveProperty('cookie');
      expect(headers).toHaveProperty('x-api-key');
      expect(headers).toHaveProperty('x-auth-token');
    });

    it('should handle empty headers object', () => {
      const headers = {};

      const sanitized = (filter as any).sanitizeHeaders(headers);

      expect(sanitized).toEqual({});
    });

    it('should handle headers with only non-sensitive data', () => {
      const headers = {
        'user-agent': 'test-agent',
        'content-type': 'application/json',
        'accept': 'application/json',
      };

      const sanitized = (filter as any).sanitizeHeaders(headers);

      expect(sanitized).toEqual(headers);
    });
  });

  describe('integration scenarios', () => {
    it('should properly format timestamp in ISO format', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
      const beforeTime = new Date().toISOString();

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockResponse.json.mock.calls[0][0];
      const timestamp = responseCall.timestamp;

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
    });

    it('should handle request without optional properties', () => {
      const minimalRequest = {
        method: 'POST',
        url: '/api/minimal',
        headers: {},
      };

      const mockHttpContext = {
        getRequest: jest.fn().mockReturnValue(minimalRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getNext: jest.fn(),
      };

      mockArgumentsHost.switchToHttp.mockReturnValue(mockHttpContext);

      const exception = new HttpException('Test', HttpStatus.INTERNAL_SERVER_ERROR);

      filter.catch(exception, mockArgumentsHost);

      expect(sentryService.setExtra).toHaveBeenCalledWith('request', {
        method: 'POST',
        url: '/api/minimal',
        headers: {},
        body: undefined,
        query: undefined,
        params: undefined,
      });
    });
  });
});
