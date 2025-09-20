import { SetMetadata } from '@nestjs/common';
import { Actions } from './abilities.factory';

export interface RequiredRule {
  action: Actions;
  subject: 'Well' | 'all';
}

export const CHECK_ABILITIES_KEY = 'check_abilities';

/**
 * Check Abilities Decorator
 * Used to specify required permissions for endpoints
 */
export const CheckAbilities = (...requirements: RequiredRule[]) =>
  SetMetadata(CHECK_ABILITIES_KEY, requirements);

/**
 * Helper decorators for common permissions
 */
export const CanCreateWell = () =>
  CheckAbilities({ action: 'create', subject: 'Well' });

export const CanReadWell = () =>
  CheckAbilities({ action: 'read', subject: 'Well' });

export const CanUpdateWell = () =>
  CheckAbilities({ action: 'update', subject: 'Well' });

export const CanUpdateWellStatus = () =>
  CheckAbilities({ action: 'updateStatus', subject: 'Well' });

export const CanDeleteWell = () =>
  CheckAbilities({ action: 'delete', subject: 'Well' });

export const CanSubmitReport = () =>
  CheckAbilities({ action: 'submitReport', subject: 'Well' });

export const CanExportWells = () =>
  CheckAbilities({ action: 'export', subject: 'Well' });

export const CanAuditWells = () =>
  CheckAbilities({ action: 'audit', subject: 'Well' });
