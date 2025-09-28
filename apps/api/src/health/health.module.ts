import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthCheckService } from './health.service';
import { DatabaseHealthIndicator } from './database-health.indicator';
import { RedisHealthIndicator } from './redis-health.indicator';
import { CircuitBreakerHealthIndicator } from './circuit-breaker-health.indicator';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { CircuitBreakerService } from '../common/resilience/circuit-breaker.service';
import { RetryService } from '../common/resilience/retry.service';
import { RepositoryModule } from '../infrastructure/repositories/repository.module';

@Module({
  imports: [TerminusModule, DatabaseModule, RedisModule, RepositoryModule],
  controllers: [HealthController],
  providers: [
    HealthCheckService,
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    CircuitBreakerHealthIndicator,
    CircuitBreakerService,
    RetryService,
  ],
  exports: [HealthCheckService],
})
export class HealthModule {}
