import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MetricsService } from './metrics.service';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { RedisModule } from '../redis/redis.module';
import { HealthModule } from '../health/health.module';
import { CircuitBreakerService } from '../common/resilience/circuit-breaker.service';
import { RetryService } from '../common/resilience/retry.service';
import { EnhancedEventBusService } from '../common/events/enhanced-event-bus.service';
import { HealthCheckService } from '../health/health.service';
import { Redis } from 'ioredis';
import { DatabasePerformanceService } from '../infrastructure/database/database-performance.service';
import { MonitoringModule as InfrastructureMonitoringModule } from '../infrastructure/monitoring/monitoring.module';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    HealthModule,
    InfrastructureMonitoringModule,
  ],
  controllers: [MonitoringController],
  providers: [
    {
      provide: MetricsService,
      useFactory: (
        databaseService: DatabaseService,
        redis: Redis,
        circuitBreakerService: CircuitBreakerService,
        retryService: RetryService,
        healthCheckService: HealthCheckService,
        eventBus: EnhancedEventBusService,
      ) => {
        return new MetricsService(
          databaseService,
          redis,
          circuitBreakerService,
          retryService,
          healthCheckService,
          eventBus,
        );
      },
      inject: [
        DatabaseService,
        'REDIS_CONNECTION',
        CircuitBreakerService,
        RetryService,
        HealthCheckService,
        EnhancedEventBusService,
      ],
    },
    CircuitBreakerService,
    RetryService,
    EnhancedEventBusService,
    DatabasePerformanceService,
  ],
  exports: [MetricsService],
})
export class MonitoringModule {}
