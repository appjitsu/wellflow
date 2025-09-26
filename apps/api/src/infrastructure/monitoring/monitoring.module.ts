import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueryPerformanceService } from './query-performance.service';
import { PerformanceAlertObserver } from './performance-alert.observer';
import { AlertService } from './alert.service';

/**
 * Monitoring Module
 * Provides performance monitoring and alerting services
 * Follows Single Responsibility Principle - only handles monitoring concerns
 */
@Module({
  imports: [ConfigModule],
  providers: [
    QueryPerformanceService,
    PerformanceAlertObserver,
    {
      provide: AlertService,
      useClass: AlertService,
    },
  ],
  exports: [QueryPerformanceService, PerformanceAlertObserver, AlertService],
})
export class MonitoringModule implements OnModuleInit {
  constructor(
    private readonly queryPerformanceService: QueryPerformanceService,
    private readonly performanceAlertObserver: PerformanceAlertObserver,
  ) {}

  /**
   * Initialize monitoring services and wire up observers
   * Implements Observer Pattern setup
   */
  onModuleInit(): void {
    // Subscribe the alert observer to performance events
    this.queryPerformanceService.subscribe(this.performanceAlertObserver);

    console.log('✅ Performance monitoring initialized with alert observer');
  }
}
