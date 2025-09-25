import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { OperatorsController } from './presentation/controllers/operators.controller';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { SentryModule } from './sentry/sentry.module';
import { LogRocketModule } from './logrocket/logrocket.module';
import { LogRocketMiddleware } from './logrocket/logrocket.middleware';
import { WellsModule } from './wells/wells.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { LeasesModule } from './leases/leases.module';
import { ProductionModule } from './production/production.module';
import { PartnersModule } from './partners/partners.module';
import { JobsModule } from './jobs/jobs.module';
import { LeaseOperatingStatementsModule } from './lease-operating-statements/lease-operating-statements.module';
import { TitleManagementModule } from './modules/title-management.module';
// import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { AbilitiesGuard } from './authorization/abilities.guard';
import { AuditLogInterceptor } from './presentation/interceptors/audit-log.interceptor';
import {
  createThrottlerConfig,
  WellFlowThrottlerGuard,
} from './common/throttler';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: createThrottlerConfig,
      inject: [ConfigService],
    }),
    CqrsModule.forRoot(),
    EventEmitterModule.forRoot(),
    SentryModule,
    LogRocketModule,
    DatabaseModule,
    RedisModule,
    AuthorizationModule,
    UsersModule,
    WellsModule,
    MonitoringModule,
    OrganizationsModule,
    LeasesModule,
    ProductionModule,
    PartnersModule,
    JobsModule,
    LeaseOperatingStatementsModule,
    TitleManagementModule,
  ],
  controllers: [AppController, OperatorsController],
  providers: [
    AppService,
    // Rate limiting guard - applied globally for security
    {
      provide: APP_GUARD,
      useClass: WellFlowThrottlerGuard,
    },
    // NOTE: JWT authentication will be re-enabled after implementing JWT strategy
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    {
      provide: APP_GUARD,
      useClass: AbilitiesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security headers to all routes (first for security)
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');

    // Apply request logging to all routes
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');

    // Apply LogRocket middleware to all routes
    consumer.apply(LogRocketMiddleware).forRoutes('*');
  }
}
