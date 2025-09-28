import { Module, Global } from '@nestjs/common';
import { RateLimitingController } from './rate-limiting.controller';
import { EnhancedRateLimiterService } from './enhanced-rate-limiter.service';
import { EnhancedRateLimitGuard } from './enhanced-rate-limit.guard';
import { CacheModule } from '../cache/cache.module';
import { MonitoringModule } from '../../monitoring/monitoring.module';
import { AuthorizationModule } from '../../authorization/authorization.module';

@Global()
@Module({
  imports: [CacheModule, MonitoringModule, AuthorizationModule],
  controllers: [RateLimitingController],
  providers: [EnhancedRateLimiterService, EnhancedRateLimitGuard],
  exports: [EnhancedRateLimiterService, EnhancedRateLimitGuard],
})
export class RateLimitingModule {}
