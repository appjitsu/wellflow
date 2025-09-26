import { Expose, Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';

type NullableDate = string | null | undefined;

const toIsoString = (value: unknown): string | null => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return null;
};

const isAfterNow = (value: NullableDate): boolean => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date > new Date();
};

const isBeforeNow = (value: NullableDate): boolean => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date < new Date();
};

const isWithinDays = (value: NullableDate, days: number): boolean => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);
  return date <= threshold;
};

const getRecord = (params: TransformFnParams): Partial<PermitResponseDto> => {
  return (params.obj as Partial<PermitResponseDto>) ?? {};
};

/**
 * Response DTO for permit data
 * Controls what data is exposed in API responses
 */
export class PermitResponseDto {
  @Expose()
  id!: string;

  @Expose()
  permitNumber!: string;

  @Expose()
  permitType!: string;

  @Expose()
  status!: string;

  @Expose()
  organizationId!: string;

  @Expose()
  wellId?: string;

  @Expose()
  issuingAgency!: string;

  @Expose()
  regulatoryAuthority?: string;

  @Expose()
  @Transform(({ value }) => toIsoString(value))
  applicationDate?: string;

  @Expose()
  @Transform(({ value }) => toIsoString(value))
  submittedDate?: string;

  @Expose()
  @Transform(({ value }) => toIsoString(value))
  approvalDate?: string;

  @Expose()
  @Transform(({ value }) => toIsoString(value))
  expirationDate?: string;

  @Expose()
  permitConditions?: Record<string, unknown>;

  @Expose()
  complianceRequirements?: Record<string, unknown>;

  @Expose()
  feeAmount?: number;

  @Expose()
  bondAmount?: number;

  @Expose()
  bondType?: string;

  @Expose()
  location?: string;

  @Expose()
  facilityId?: string;

  @Expose()
  documentIds?: string[];

  @Expose()
  createdByUserId!: string;

  @Expose()
  updatedByUserId?: string;

  @Expose()
  @Transform(({ value }) =>
    new Date(value as string | number | Date).toISOString(),
  )
  createdAt!: string;

  @Expose()
  @Transform(({ value }) =>
    new Date(value as string | number | Date).toISOString(),
  )
  updatedAt!: string;

  // Computed fields for business logic
  @Expose()
  @Transform((params) => {
    const record = getRecord(params);
    return isBeforeNow(record.expirationDate);
  })
  isExpired!: boolean;

  @Expose()
  @Transform((params) => {
    const record = getRecord(params);
    return (
      isWithinDays(record.expirationDate, 30) &&
      !isBeforeNow(record.expirationDate)
    );
  })
  isExpiringSoon!: boolean;

  @Expose()
  @Transform((params) => {
    const record = getRecord(params);
    const activeStatuses: string[] = ['approved', 'renewed'];
    if (!record.status || !activeStatuses.includes(record.status)) {
      return false;
    }
    if (!record.expirationDate) {
      return true;
    }
    return (
      isAfterNow(record.expirationDate) ||
      toIsoString(record.expirationDate) === null
    );
  })
  isActive!: boolean;

  @Expose()
  @Transform((params) => {
    const record = getRecord(params);
    const renewalTypes = new Set([
      'facility',
      'pipeline',
      'disposal',
      'injection',
    ]);
    if (!record.permitType || !renewalTypes.has(record.permitType)) {
      return false;
    }
    if (!record.expirationDate) {
      return false;
    }
    const expiration = new Date(record.expirationDate);
    if (Number.isNaN(expiration.getTime())) {
      return false;
    }
    const renewalDate = new Date(expiration);
    renewalDate.setMonth(renewalDate.getMonth() - 3); // 90 days before expiry
    return renewalDate <= new Date();
  })
  requiresRenewal!: boolean;
}
