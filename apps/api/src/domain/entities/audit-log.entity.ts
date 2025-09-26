import { randomUUID } from 'crypto';
import { AggregateRoot } from '../shared/aggregate-root';

/**
 * Audit log action types
 */
export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXECUTE = 'EXECUTE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SUBMIT = 'SUBMIT',
  CANCEL = 'CANCEL',
  RESTORE = 'RESTORE',
  ARCHIVE = 'ARCHIVE',
}

/**
 * Audit log resource types
 */
export enum AuditResourceType {
  USER = 'USER',
  ORGANIZATION = 'ORGANIZATION',
  WELL = 'WELL',
  LEASE = 'LEASE',
  PRODUCTION = 'PRODUCTION',
  PARTNER = 'PARTNER',
  FINANCIAL = 'FINANCIAL',
  COMPLIANCE = 'COMPLIANCE',
  DOCUMENT = 'DOCUMENT',
  EQUIPMENT = 'EQUIPMENT',
  DRILLING_PROGRAM = 'DRILLING_PROGRAM',
  WORKOVER = 'WORKOVER',
  MAINTENANCE = 'MAINTENANCE',
  AFE = 'AFE',
  DIVISION_ORDER = 'DIVISION_ORDER',
  JOA = 'JOA',
  REVENUE_DISTRIBUTION = 'REVENUE_DISTRIBUTION',
  VENDOR = 'VENDOR',
  SYSTEM = 'SYSTEM',
  API = 'API',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
}

/**
 * Audit log metadata interface
 */
export interface AuditMetadata {
  sessionId?: string;
  correlationId?: string;
  userAgent?: string;
  ipAddress?: string;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  deviceInfo?: {
    type?: string;
    os?: string;
    browser?: string;
  };
  businessContext?: Record<string, unknown>;
  technicalContext?: Record<string, unknown>;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  responseSize?: number;
  serviceName?: string;
  reportId?: string;
  wellId?: string;
  externalSubmissionId?: string;
  reportType?: string;
  periodStart?: string;
  periodEnd?: string;
  recordCount?: number;
  rejectionReason?: string;
  errorType?: string;
  errorCode?: string;
}

/**
 * Audit log entity - represents a single auditable action
 */
export class AuditLog extends AggregateRoot {
  constructor(
    private readonly id: string,
    private readonly userId: string | null,
    private readonly organizationId: string | null,
    private readonly action: AuditAction,
    private readonly resourceType: AuditResourceType,
    private readonly resourceId: string | null,
    private readonly timestamp: Date,
    private readonly ipAddress: string | null,
    private readonly userAgent: string | null,
    private readonly oldValues: Record<string, unknown> | null,
    private readonly newValues: Record<string, unknown> | null,
    private readonly success: boolean,
    private readonly errorMessage: string | null,
    private readonly metadata: AuditMetadata | null,
    private readonly requestId: string | null,
    private readonly endpoint: string | null,
    private readonly method: string | null,
    private readonly duration: number | null,
  ) {
    super();
  }

  /**
   * Factory method for creating audit logs
   */
  static create(params: {
    userId?: string;
    organizationId?: string;
    action: AuditAction;
    resourceType: AuditResourceType;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    success?: boolean;
    errorMessage?: string;
    metadata?: AuditMetadata;
    requestId?: string;
    endpoint?: string;
    method?: string;
    duration?: number;
  }): AuditLog {
    return new AuditLog(
      randomUUID(),
      params.userId || null,
      params.organizationId || null,
      params.action,
      params.resourceType,
      params.resourceId || null,
      new Date(),
      params.ipAddress || null,
      params.userAgent || null,
      params.oldValues || null,
      params.newValues || null,
      params.success !== false, // Default to true
      params.errorMessage || null,
      params.metadata || null,
      params.requestId || null,
      params.endpoint || null,
      params.method || null,
      params.duration || null,
    );
  }

  /**
   * Getters
   */
  getId(): string {
    return this.id;
  }

  getUserId(): string | null {
    return this.userId;
  }

  getOrganizationId(): string | null {
    return this.organizationId;
  }

  getAction(): AuditAction {
    return this.action;
  }

  getResourceType(): AuditResourceType {
    return this.resourceType;
  }

  getResourceId(): string | null {
    return this.resourceId;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getIpAddress(): string | null {
    return this.ipAddress;
  }

  getUserAgent(): string | null {
    return this.userAgent;
  }

  getOldValues(): Record<string, unknown> | null {
    return this.oldValues;
  }

  getNewValues(): Record<string, unknown> | null {
    return this.newValues;
  }

  getSuccess(): boolean {
    return this.success;
  }

  getErrorMessage(): string | null {
    return this.errorMessage;
  }

  getMetadata(): AuditMetadata | null {
    return this.metadata;
  }

  getRequestId(): string | null {
    return this.requestId;
  }

  getEndpoint(): string | null {
    return this.endpoint;
  }

  getMethod(): string | null {
    return this.method;
  }

  getDuration(): number | null {
    return this.duration;
  }

  /**
   * Business logic methods
   */
  isSuccessful(): boolean {
    return this.success;
  }

  hasUserContext(): boolean {
    return this.userId !== null;
  }

  hasOrganizationContext(): boolean {
    return this.organizationId !== null;
  }

  hasResourceContext(): boolean {
    return this.resourceId !== null;
  }

  getResourceKey(): string {
    return `${this.resourceType}:${this.resourceId || 'global'}`;
  }

  getActionDescription(): string {
    const resource = this.resourceId
      ? `${this.resourceType}(${this.resourceId})`
      : this.resourceType;
    return `${this.action} ${resource}`;
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      organizationId: this.organizationId,
      action: this.action,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      timestamp: this.timestamp.toISOString(),
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      oldValues: this.oldValues,
      newValues: this.newValues,
      success: this.success,
      errorMessage: this.errorMessage,
      metadata: this.metadata,
      requestId: this.requestId,
      endpoint: this.endpoint,
      method: this.method,
      duration: this.duration,
    };
  }
}
