import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SentryService } from '../sentry/sentry.service';
import { LogRocketService } from '../logrocket/logrocket.service';
import { MetricsService } from './metrics.service';
import { CircuitBreakerService } from '../common/resilience/circuit-breaker.service';
import { RetryService } from '../common/resilience/retry.service';
import { EnhancedEventBusService } from '../common/events/enhanced-event-bus.service';
import { DatabasePerformanceService } from '../infrastructure/database/database-performance.service';
import { AlertService } from '../infrastructure/monitoring/alert.service';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly sentryService: SentryService,
    private readonly logRocketService: LogRocketService,
    private readonly metricsService: MetricsService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly retryService: RetryService,
    private readonly eventBus: EnhancedEventBusService,
    private readonly databasePerformanceService: DatabasePerformanceService,
    private readonly alertService: AlertService,
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
      sentryLevel as 'debug' | 'info' | 'warning' | 'error' | 'fatal',
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
  testTrack(
    @Body() body: { event: string; properties?: Record<string, unknown> },
  ) {
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

  @Get('metrics')
  @ApiOperation({ summary: 'Get comprehensive system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async getMetrics() {
    return this.metricsService.getSystemMetrics();
  }

  @Get('metrics/circuit-breakers')
  @ApiOperation({ summary: 'Get circuit breaker metrics' })
  @ApiResponse({ status: 200, description: 'Circuit breaker metrics' })
  getCircuitBreakerMetrics() {
    return {
      timestamp: new Date().toISOString(),
      circuitBreakers: this.circuitBreakerService.getAllMetrics(),
    };
  }

  @Get('metrics/events')
  @ApiOperation({ summary: 'Get event processing metrics' })
  @ApiResponse({ status: 200, description: 'Event processing metrics' })
  getEventMetrics() {
    return {
      timestamp: new Date().toISOString(),
      events: this.eventBus.getEventMetrics(),
    };
  }

  @Get('metrics/resilience')
  @ApiOperation({
    summary: 'Get resilience metrics (circuit breakers, retries)',
  })
  @ApiResponse({ status: 200, description: 'Resilience metrics' })
  // eslint-disable-next-line sonarjs/no-identical-functions
  getResilienceMetrics() {
    return {
      timestamp: new Date().toISOString(),
      circuitBreakers: this.circuitBreakerService.getAllMetrics(),
      // retryMetrics: this.retryService.getAllMetrics(), // Would need to implement
    };
  }

  @Post('circuit-breakers/reset')
  @ApiOperation({ summary: 'Reset a circuit breaker' })
  @ApiResponse({ status: 200, description: 'Circuit breaker reset' })
  resetCircuitBreaker(@Body() body: { serviceName: string }) {
    const { serviceName } = body;
    const success = this.circuitBreakerService.resetCircuitBreaker(serviceName);

    if (success) {
      return {
        success: true,
        message: `Circuit breaker for ${serviceName} reset successfully`,
      };
    } else {
      throw new HttpException(
        `Circuit breaker for ${serviceName} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('metrics/database')
  @ApiOperation({ summary: 'Get database performance metrics' })
  @ApiResponse({ status: 200, description: 'Database performance metrics' })
  async getDatabaseMetrics() {
    return {
      timestamp: new Date().toISOString(),
      performance:
        await this.databasePerformanceService.getPerformanceMetrics(),
      queryStats: this.databasePerformanceService.getQueryPerformanceStats(),
    };
  }

  @Get('metrics/database/slow-queries')
  @ApiOperation({ summary: 'Get slow database queries' })
  @ApiResponse({ status: 200, description: 'Slow database queries' })
  getSlowQueries(
    @Query('threshold', ParseIntPipe) threshold: number = 1000,
    @Query('hours', ParseIntPipe) hours: number = 1,
  ) {
    const timeRangeMs = hours * 60 * 60 * 1000;
    return {
      timestamp: new Date().toISOString(),
      threshold,
      timeRange: `${hours} hours`,
      slowQueries: this.databasePerformanceService.getSlowQueries(
        timeRangeMs,
        threshold,
      ),
    };
  }

  @Get('metrics/database/locks')
  @ApiOperation({ summary: 'Get database lock information' })
  @ApiResponse({ status: 200, description: 'Database lock information' })
  getDatabaseLocks() {
    return {
      timestamp: new Date().toISOString(),
      locks: this.databasePerformanceService.getLockInfo(),
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get active alerts' })
  @ApiResponse({ status: 200, description: 'Active alerts' })
  getActiveAlerts() {
    return {
      timestamp: new Date().toISOString(),
      alerts: this.alertService.getActiveAlerts(),
    };
  }

  @Get('alerts/history')
  @ApiOperation({ summary: 'Get alert history' })
  @ApiResponse({ status: 200, description: 'Alert history' })
  getAlertHistory(@Query('limit', ParseIntPipe) limit?: number) {
    return {
      timestamp: new Date().toISOString(),
      alerts: this.alertService.getAlertHistory(limit),
    };
  }

  @Post('alerts/:alertId/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  async resolveAlert(@Param('alertId') alertId: string) {
    const resolved = await this.alertService.resolveAlert(alertId);

    if (resolved) {
      return {
        success: true,
        message: `Alert ${alertId} resolved successfully`,
      };
    } else {
      throw new HttpException(
        `Alert ${alertId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('alerts/test')
  @ApiOperation({ summary: 'Create a test alert' })
  @ApiResponse({ status: 200, description: 'Test alert created' })
  async createTestAlert(
    @Body()
    body?: {
      message?: string;
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    },
  ) {
    const alert = await this.alertService.createAlert({
      type: 'SYSTEM',
      severity: body?.severity || 'LOW',
      title: 'Test Alert',
      message:
        body?.message ||
        'This is a test alert to verify the alerting system is working',
      metadata: { test: true, source: 'monitoring-controller' },
    });

    return {
      success: true,
      message: 'Test alert created successfully',
      alertId: alert.id,
    };
  }
}
