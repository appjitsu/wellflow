import { Test, TestingModule } from '@nestjs/testing';
import { RequestLoggingMiddleware } from './request-logging.middleware';

describe('RequestLoggingMiddleware', () => {
  let middleware: RequestLoggingMiddleware;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestLoggingMiddleware],
    }).compile();

    middleware = module.get<RequestLoggingMiddleware>(RequestLoggingMiddleware);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });
});
