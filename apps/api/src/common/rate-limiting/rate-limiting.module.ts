import { Module, Global } from '@nestjs/common';
import { RateLimitingController } from './rate-limiting.controller';
import { EnhancedRateLimiterService } from './enhanced-rate-limiter.service';
import { EnhancedRateLimitGuard } from './enhanced-rate-limit.guard';
import { CacheModule } from '../cache/cache.module';

// Mock MetricsService for rate limiting
class MockMetricsService {
  recordApiRequest(): void {
    // Mock implementation - does nothing
  }
}

@Global()
@Module({
  imports: [CacheModule],
  controllers: [RateLimitingController],
  providers: [
    EnhancedRateLimiterService,
    EnhancedRateLimitGuard,
    {
      provide: 'MetricsService',
      useClass: MockMetricsService,
    },
  ],
  exports: [EnhancedRateLimiterService, EnhancedRateLimitGuard],
})
export class RateLimitingModule {}
