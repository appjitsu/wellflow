import { Module, Global } from '@nestjs/common';
import { RateLimitingController } from './rate-limiting.controller';
import { EnhancedRateLimiterService } from './enhanced-rate-limiter.service';
import { EnhancedRateLimitGuard } from './enhanced-rate-limit.guard';

@Global()
@Module({
  controllers: [RateLimitingController],
  providers: [EnhancedRateLimiterService, EnhancedRateLimitGuard],
  exports: [EnhancedRateLimiterService, EnhancedRateLimitGuard],
})
export class RateLimitingModule {}
