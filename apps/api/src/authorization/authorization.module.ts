import { Module } from '@nestjs/common';
import { AbilitiesFactory } from './abilities.factory';
import { AbilitiesGuard } from './abilities.guard';

/**
 * Authorization Module
 * Provides CASL-based authorization services
 */
@Module({
  providers: [AbilitiesFactory, AbilitiesGuard],
  exports: [AbilitiesFactory, AbilitiesGuard],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AuthorizationModule {}
