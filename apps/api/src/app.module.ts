import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { SentryModule } from './sentry/sentry.module';
import { WellsModule } from './wells/wells.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { AbilitiesGuard } from './authorization/abilities.guard';
import { AuditLogInterceptor } from './presentation/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    CqrsModule.forRoot(),
    EventEmitterModule.forRoot(),
    SentryModule,
    DatabaseModule,
    RedisModule,
    UsersModule,
    WellsModule,
    AuthorizationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
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
export class AppModule {}
