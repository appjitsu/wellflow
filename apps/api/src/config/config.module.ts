import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './app.config';

/**
 * Configuration Module
 *
 * Global module that provides centralized configuration management
 * Exports AppConfigService for type-safe environment variable access
 */
@Global()
@Module({
  imports: [NestConfigModule],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ConfigModule {}
