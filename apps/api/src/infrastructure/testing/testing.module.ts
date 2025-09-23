import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PerformanceTestService } from './performance-test.service';
import { PerformanceTestCommand } from './performance-test.command';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { TenantInfrastructureModule } from '../tenant/tenant-infrastructure.module';

/**
 * Testing Module
 * Provides performance testing services and CLI commands for KAN-33 validation
 * Follows Single Responsibility Principle - only handles testing concerns
 */
@Module({
  imports: [ConfigModule, MonitoringModule, TenantInfrastructureModule],
  providers: [PerformanceTestService, PerformanceTestCommand],
  exports: [PerformanceTestService],
})
export class TestingModule {}
