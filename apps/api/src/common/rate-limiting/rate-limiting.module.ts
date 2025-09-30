import { Module, Global, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RateLimitingController } from './rate-limiting.controller';
import { EnhancedRateLimiterService } from './enhanced-rate-limiter.service';
import { EnhancedRateLimitGuard } from './enhanced-rate-limit.guard';
import { DDoSProtectionService } from './ddos-protection.service';
import { IPReputationService } from './ip-reputation.service';
import { BypassTokenService } from './bypass-token.service';
import { RateLimitMonitoringService } from './rate-limit-monitoring.service';
import {
  AbuseIPDBService,
  MaxMindService,
  ThreatFeedService,
  ExternalThreatIntelligenceService,
} from './external-threat-intelligence';
import { ThreatIntelligenceSchedulerService } from './external-threat-intelligence/threat-intelligence-scheduler.service';

import { CacheModule } from '../cache/cache.module';
import { MonitoringModule } from '../../monitoring/monitoring.module';
import { AuthorizationModule } from '../../authorization/authorization.module';
import { JobsModule } from '../../jobs/jobs.module';
import { ConfigModule as AppConfigModule } from '../../config/config.module';

@Global()
@Module({
  imports: [
    EventEmitterModule,
    AppConfigModule,
    CacheModule,
    MonitoringModule,
    AuthorizationModule,
    forwardRef(() => JobsModule),
  ],
  controllers: [RateLimitingController],
  providers: [
    EnhancedRateLimiterService,
    EnhancedRateLimitGuard,
    DDoSProtectionService,
    IPReputationService,
    BypassTokenService,
    RateLimitMonitoringService,
    AbuseIPDBService,
    MaxMindService,
    ThreatFeedService,
    ExternalThreatIntelligenceService,
    ThreatIntelligenceSchedulerService,
  ],
  exports: [
    EnhancedRateLimiterService,
    EnhancedRateLimitGuard,
    DDoSProtectionService,
    IPReputationService,
    BypassTokenService,
    RateLimitMonitoringService,
    AbuseIPDBService,
    MaxMindService,
    ThreatFeedService,
    ExternalThreatIntelligenceService,
    ThreatIntelligenceSchedulerService,
  ],
})
export class RateLimitingModule {}
