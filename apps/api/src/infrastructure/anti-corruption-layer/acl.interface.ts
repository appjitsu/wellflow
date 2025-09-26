import { RegulatoryReport } from '../../domain/entities/regulatory-report.entity';

/**
 * Anti-Corruption Layer (ACL) interface
 * Protects domain model from external system changes
 */
export interface IAntiCorruptionLayer {
  /**
   * Get ACL identifier
   */
  getIdentifier(): string;

  /**
   * Check if ACL can handle the given external system
   */
  canHandle(externalSystem: string, version?: string): boolean;

  /**
   * Transform external data to internal domain format
   */
  transformToDomain<TDomain>(
    externalData: unknown,
    context: TransformationContext,
  ): Promise<TransformationResult<TDomain>>;

  /**
   * Transform internal domain data to external format
   */
  transformToExternal(
    domainData: unknown,
    context: TransformationContext,
  ): Promise<TransformationResult<unknown>>;

  /**
   * Validate external data structure
   */
  validateExternalData(
    externalData: unknown,
    schema: ValidationSchema,
  ): Promise<ValidationResult>;

  /**
   * Get supported external system versions
   */
  getSupportedVersions(): string[];

  /**
   * Get transformation statistics
   */
  getStatistics(): ACLStatistics;
}

/**
 * Transformation context
 */
export interface TransformationContext {
  operation: 'import' | 'export' | 'sync';
  entityType: string;
  externalSystem: string;
  externalVersion?: string;
  correlationId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Transformation result
 */
export interface TransformationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    transformationTime: number;
    fieldsMapped: number;
    fieldsSkipped: number;
    externalVersion: string;
    internalVersion: string;
  };
}

/**
 * Validation schema for external data
 */
export interface ValidationSchema {
  requiredFields: string[];
  optionalFields: string[];
  fieldTypes: Record<
    string,
    'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  >;
  customValidators?: Array<{
    field: string;
    validator: (value: unknown) => { isValid: boolean; message?: string };
    errorMessage: string;
    severity?: 'error' | 'warning';
    code?: string;
  }>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
    code?: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * ACL Statistics
 */
export interface ACLStatistics {
  totalTransformations: number;
  successfulTransformations: number;
  failedTransformations: number;
  averageTransformationTime: number;
  lastTransformationTime: Date;
  supportedSystems: string[];
  errorRate: number;
  uptimePercentage?: number;
}

/**
 * External System Adapter interface
 */
export interface IExternalSystemAdapter {
  /**
   * Connect to external system
   */
  connect(config: ConnectionConfig): Promise<ConnectionResult>;

  /**
   * Execute operation on external system
   */
  execute(operation: ExternalOperation): Promise<ExternalOperationResult>;

  /**
   * Get external system metadata
   */
  getMetadata(): ExternalSystemMetadata;

  /**
   * Health check for external system
   */
  healthCheck(): Promise<HealthCheckResult>;
}

/**
 * Connection configuration
 */
export interface ConnectionConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  timeout: number;
  retryConfig?: {
    maxAttempts: number;
    initialDelay: number;
  };
}

/**
 * Connection result
 */
export interface ConnectionResult {
  success: boolean;
  sessionId?: string;
  capabilities?: string[];
  error?: string;
}

/**
 * External operation
 */
export interface ExternalOperation {
  operationType: 'create' | 'read' | 'update' | 'delete' | 'query';
  entityType: string;
  data?: unknown;
  filters?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

/**
 * External operation result
 */
export interface ExternalOperationResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    requestId: string;
    processingTime: number;
    rateLimitRemaining?: number;
  };
}

/**
 * External system metadata
 */
export interface ExternalSystemMetadata {
  systemName: string;
  version: string;
  supportedEntities: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  capabilities: string[];
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  version?: string;
  error?: string;
}

/**
 * ACL Factory interface
 */
export interface IACLFactory {
  /**
   * Create ACL for specific external system
   */
  createACL(
    externalSystem: string,
    version?: string,
  ): Promise<IAntiCorruptionLayer>;

  /**
   * Get supported external systems
   */
  getSupportedSystems(): string[];
}

/**
 * Regulatory ACL Manager
 * Manages multiple ACLs for different regulatory agencies
 */
export interface IRegulatoryACLManager {
  /**
   * Get ACL for specific agency
   */
  getACLForAgency(
    agencyCode: string,
    version?: string,
  ): Promise<IAntiCorruptionLayer>;

  /**
   * Register custom ACL
   */
  registerACL(acl: IAntiCorruptionLayer): void;

  /**
   * Transform regulatory data for external submission
   */
  transformForSubmission(
    report: RegulatoryReport,
    agencyCode: string,
  ): Promise<TransformationResult<unknown>>;

  /**
   * Transform external response to internal format
   */
  transformSubmissionResponse(
    externalResponse: unknown,
    agencyCode: string,
  ): Promise<TransformationResult<unknown>>;

  /**
   * Get ACL statistics across all agencies
   */
  getAllACLStatistics(): Record<string, ACLStatistics>;
}
