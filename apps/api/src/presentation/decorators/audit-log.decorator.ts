import { SetMetadata } from '@nestjs/common';

export interface AuditLogOptions {
  action: string;
  resource?: string;
  description?: string;
}

/**
 * Audit Log Decorator
 * Used to mark endpoints that should be audited for compliance
 */
export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata('auditLog', options);
