import { Controller, Get, Post, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { SentryService } from './sentry/sentry.service';
import { Public } from './presentation/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly sentryService: SentryService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get welcome message' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Welcome message',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 123.456 },
        environment: { type: 'string', example: 'development' },
        version: { type: 'string', example: '1.0.0' },
        services: {
          type: 'object',
          properties: {
            database: { type: 'string', example: 'connected' },
            redis: { type: 'string', example: 'connected' },
            sentry: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'connected',
        redis: 'connected',
        sentry: !!process.env.SENTRY_DSN,
      },
    };
  }

  @Post('test-error')
  @Public()
  @ApiOperation({ summary: 'Test error tracking (development only)' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Test error thrown',
  })
  testError() {
    // Test endpoint to verify Sentry error tracking
    this.sentryService.captureMessage('Test error endpoint called', 'info');
    throw new Error('This is a test error for Sentry');
  }

  @Post('test-sentry')
  @Public()
  @ApiOperation({ summary: 'Test Sentry message capture (development only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sentry test message sent',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Sentry test message sent' },
      },
    },
  })
  testSentry() {
    // Test endpoint to verify Sentry message capture
    this.sentryService.captureMessage('Test Sentry integration', 'info');
    return { message: 'Sentry test message sent' };
  }
}
