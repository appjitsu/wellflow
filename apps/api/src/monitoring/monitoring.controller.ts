import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SentryService } from '../sentry/sentry.service';
import { LogRocketService } from '../logrocket/logrocket.service';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly sentryService: SentryService,
    private readonly logRocketService: LogRocketService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check monitoring services health' })
  @ApiResponse({ status: 200, description: 'Monitoring services status' })
  getHealth() {
    return {
      timestamp: new Date().toISOString(),
      services: {
        sentry: {
          status: 'active',
          description: 'Error tracking and performance monitoring',
        },
        logRocket: {
          status: this.logRocketService.isReady() ? 'active' : 'inactive',
          description: 'Session recording and API monitoring',
        },
      },
    };
  }

  @Post('test-error')
  @ApiOperation({ summary: 'Test error tracking (Sentry + LogRocket)' })
  @ApiResponse({ status: 500, description: 'Test error thrown' })
  testError(@Body() body?: { message?: string }) {
    const errorMessage = body?.message || 'Test API error for monitoring';

    // Log to LogRocket before throwing error
    this.logRocketService.log('About to throw test error', 'warn', {
      requestedMessage: body?.message,
      endpoint: '/monitoring/test-error',
    });

    // Throw error that will be caught by exception filter
    throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Post('test-log')
  @ApiOperation({ summary: 'Test logging (LogRocket)' })
  @ApiResponse({ status: 200, description: 'Log message sent' })
  testLog(
    @Body() body: { message: string; level?: 'info' | 'warn' | 'error' },
  ) {
    const { message, level = 'info' } = body;

    // Log to LogRocket
    this.logRocketService.log(message, level, {
      endpoint: '/monitoring/test-log',
      timestamp: new Date().toISOString(),
    });

    // Also capture in Sentry as a message
    const sentryLevel = level === 'warn' ? 'warning' : level;
    this.sentryService.captureMessage(
      `API Log: ${message}`,
      sentryLevel as any,
      'TEST_LOG',
    );

    return {
      success: true,
      message: 'Log message sent to monitoring services',
      data: { message, level },
    };
  }

  @Post('test-track')
  @ApiOperation({ summary: 'Test event tracking (LogRocket)' })
  @ApiResponse({ status: 200, description: 'Event tracked' })
  testTrack(@Body() body: { event: string; properties?: Record<string, any> }) {
    const { event, properties = {} } = body;

    // Track event in LogRocket
    this.logRocketService.track(event, {
      ...properties,
      endpoint: '/monitoring/test-track',
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Event tracked successfully',
      data: { event, properties },
    };
  }

  @Post('identify-user')
  @ApiOperation({ summary: 'Test user identification (LogRocket + Sentry)' })
  @ApiResponse({ status: 200, description: 'User identified' })
  identifyUser(
    @Body() body: { userId: string; email?: string; username?: string },
  ) {
    const { userId, email, username } = body;

    // Set user context in both services
    this.sentryService.setUser({ id: userId, email, username });

    return {
      success: true,
      message: 'User identified in monitoring services',
      data: { userId, email, username },
    };
  }

  @Get('session-url')
  @ApiOperation({ summary: 'Get LogRocket session URL' })
  @ApiResponse({ status: 200, description: 'LogRocket session URL' })
  async getSessionUrl() {
    if (!this.logRocketService.isReady()) {
      return {
        success: false,
        message: 'LogRocket is not initialized',
        sessionURL: null,
      };
    }

    const sessionURL = await this.logRocketService.getSessionURL();

    return {
      success: true,
      message: 'LogRocket session URL retrieved',
      sessionURL,
    };
  }
}
