import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthCheckService } from './health.service';
import { DatabaseHealthIndicator } from './database-health.indicator';
import { RedisHealthIndicator } from './redis-health.indicator';
import { CircuitBreakerHealthIndicator } from './circuit-breaker-health.indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    HealthCheckService,
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    CircuitBreakerHealthIndicator,
  ],
  exports: [HealthCheckService],
})
export class HealthModule {}
