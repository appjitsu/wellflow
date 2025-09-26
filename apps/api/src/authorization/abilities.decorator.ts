import { SetMetadata } from '@nestjs/common';
import { Actions } from './abilities.factory';

export interface RequiredRule {
  action: Actions;
  subject:
    | 'Well'
    | 'User'
    | 'Organization'
    | 'Lease'
    | 'Production'
    | 'Partner'
    | 'Afe'
    | 'Incident'
    | 'ComplianceReport'
    | 'DrillingProgram'
    | 'Workover'
    | 'OwnerPayment'
    | 'CashCall'
    | 'JointOperatingAgreement'
    | 'JibStatement'
    | 'AuditLog'
    | 'all';
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

export const CanCreateUser = () =>
  CheckAbilities({ action: 'create', subject: 'User' });

export const CanReadUser = () =>
  CheckAbilities({ action: 'read', subject: 'User' });

// AFE permissions
export const CanCreateAfe = () =>
  CheckAbilities({ action: 'create', subject: 'Afe' });

export const CanReadAfe = () =>
  CheckAbilities({ action: 'read', subject: 'Afe' });

export const CanUpdateAfe = () =>
  CheckAbilities({ action: 'update', subject: 'Afe' });

export const CanDeleteAfe = () =>
  CheckAbilities({ action: 'delete', subject: 'Afe' });

export const CanSubmitAfe = () =>
  CheckAbilities({ action: 'submit', subject: 'Afe' });

export const CanApproveAfe = () =>
  CheckAbilities({ action: 'approve', subject: 'Afe' });

export const CanRejectAfe = () =>
  CheckAbilities({ action: 'reject', subject: 'Afe' });

export const CanExportAfes = () =>
  CheckAbilities({ action: 'export', subject: 'Afe' });

export const CanAuditAfes = () =>
  CheckAbilities({ action: 'audit', subject: 'Afe' });

export const CanUpdateUser = () =>
  CheckAbilities({ action: 'update', subject: 'User' });

export const CanDeleteUser = () =>
  CheckAbilities({ action: 'delete', subject: 'User' });

export const CanCreateOrganization = () =>
  CheckAbilities({ action: 'create', subject: 'Organization' });

export const CanReadOrganization = () =>
  CheckAbilities({ action: 'read', subject: 'Organization' });

export const CanUpdateOrganization = () =>
  CheckAbilities({ action: 'update', subject: 'Organization' });

export const CanDeleteOrganization = () =>
  CheckAbilities({ action: 'delete', subject: 'Organization' });

export const CanCreateLease = () =>
  CheckAbilities({ action: 'create', subject: 'Lease' });

export const CanReadLease = () =>
  CheckAbilities({ action: 'read', subject: 'Lease' });

export const CanUpdateLease = () =>
  CheckAbilities({ action: 'update', subject: 'Lease' });

export const CanDeleteLease = () =>
  CheckAbilities({ action: 'delete', subject: 'Lease' });

export const CanCreateProduction = () =>
  CheckAbilities({ action: 'create', subject: 'Production' });

export const CanReadProduction = () =>
  CheckAbilities({ action: 'read', subject: 'Production' });

export const CanUpdateProduction = () =>
  CheckAbilities({ action: 'update', subject: 'Production' });

export const CanDeleteProduction = () =>
  CheckAbilities({ action: 'delete', subject: 'Production' });

export const CanCreatePartner = () =>
  CheckAbilities({ action: 'create', subject: 'Partner' });

export const CanReadPartner = () =>
  CheckAbilities({ action: 'read', subject: 'Partner' });

export const CanUpdatePartner = () =>
  CheckAbilities({ action: 'update', subject: 'Partner' });

export const CanDeletePartner = () =>
  CheckAbilities({ action: 'delete', subject: 'Partner' });

// Incident permissions
export const CanCreateIncident = () =>
  CheckAbilities({ action: 'create', subject: 'Incident' });

export const CanReadIncident = () =>
  CheckAbilities({ action: 'read', subject: 'Incident' });

export const CanUpdateIncident = () =>
  CheckAbilities({ action: 'update', subject: 'Incident' });

export const CanDeleteIncident = () =>
  CheckAbilities({ action: 'delete', subject: 'Incident' });

export const CanExportIncidents = () =>
  CheckAbilities({ action: 'export', subject: 'Incident' });

export const CanAuditIncidents = () =>
  CheckAbilities({ action: 'audit', subject: 'Incident' });

export const CanUpdateIncidentStatus = () =>
  CheckAbilities({ action: 'updateStatus', subject: 'Incident' });

// Drilling Program permissions
export const CanCreateDrillingProgram = () =>
  CheckAbilities({ action: 'create', subject: 'DrillingProgram' });

export const CanReadDrillingProgram = () =>
  CheckAbilities({ action: 'read', subject: 'DrillingProgram' });

export const CanUpdateDrillingProgram = () =>
  CheckAbilities({ action: 'update', subject: 'DrillingProgram' });

export const CanExportDrillingPrograms = () =>
  CheckAbilities({ action: 'export', subject: 'DrillingProgram' });

export const CanAuditDrillingPrograms = () =>
  CheckAbilities({ action: 'audit', subject: 'DrillingProgram' });

// Workover permissions
export const CanCreateWorkover = () =>
  CheckAbilities({ action: 'create', subject: 'Workover' });

export const CanReadWorkover = () =>
  CheckAbilities({ action: 'read', subject: 'Workover' });

export const CanUpdateWorkover = () =>
  CheckAbilities({ action: 'update', subject: 'Workover' });

export const CanExportWorkovers = () =>
  CheckAbilities({ action: 'export', subject: 'Workover' });

export const CanAuditWorkovers = () =>
  CheckAbilities({ action: 'audit', subject: 'Workover' });
