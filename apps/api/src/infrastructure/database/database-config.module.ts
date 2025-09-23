import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  ConnectionPoolConfigService,
  DevelopmentPoolStrategy,
  ProductionPoolStrategy,
  TestPoolStrategy,
} from './connection-pool-config.service';
import {
  DrizzlePerformanceInterceptor,
  PerformanceAwareDatabaseFactory,
  PerformanceAwareDrizzleService,
} from './drizzle-performance.interceptor';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { PaginationModule } from '../pagination/pagination.module';

/**
 * Database Configuration Module
 * Provides optimized connection pool configuration services
 * Follows Single Responsibility Principle - only handles database configuration
 */
@Module({
  imports: [ConfigModule, MonitoringModule, PaginationModule],
  providers: [
    // Connection pool strategies
    DevelopmentPoolStrategy,
    ProductionPoolStrategy,
    TestPoolStrategy,

    // Main configuration service
    ConnectionPoolConfigService,

    // Performance monitoring services
    DrizzlePerformanceInterceptor,
    PerformanceAwareDatabaseFactory,
    PerformanceAwareDrizzleService,
  ],
  exports: [
    ConnectionPoolConfigService,
    DevelopmentPoolStrategy,
    ProductionPoolStrategy,
    TestPoolStrategy,
    DrizzlePerformanceInterceptor,
    PerformanceAwareDatabaseFactory,
    PerformanceAwareDrizzleService,
  ],
})
export class DatabaseConfigModule {}
