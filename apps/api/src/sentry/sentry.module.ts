import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { SentryService } from './sentry.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SENTRY_INIT',
      useFactory: (configService: ConfigService) => {
        const dsn = configService.get<string>('SENTRY_DSN');
        const environment = configService.get<string>(
          'SENTRY_ENVIRONMENT',
          'development',
        );
        const release = configService.get<string>('SENTRY_RELEASE', '1.0.0');

        if (dsn) {
          Sentry.init({
            dsn,
            environment,
            release,
            tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
            profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
            integrations: [
              Sentry.httpIntegration(),
              Sentry.expressIntegration(),
              Sentry.nodeContextIntegration(),
            ],
            beforeSend(event) {
              // Filter out sensitive data
              if (event.request?.headers) {
                delete event.request.headers.authorization;
                delete event.request.headers.cookie;
              }
              return event;
            },
          });

          console.log('✅ Sentry initialized for API');
        } else {
          console.log('⚠️  Sentry DSN not configured, skipping initialization');
        }

        return Sentry;
      },
      inject: [ConfigService],
    },
    SentryService,
  ],
  exports: [SentryService],
})
export class SentryModule {
  // This module configures Sentry for error tracking and performance monitoring
}
