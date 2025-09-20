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
export class AuthorizationModule {}
