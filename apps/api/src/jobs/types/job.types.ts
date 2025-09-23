/**
 * Job Types and Interfaces for WellFlow Background Processing
 *
 * Defines the data structures and types for all background jobs
 * in the oil & gas production management system.
 */

export enum JobType {
  DATA_VALIDATION = 'data-validation',
  REPORT_GENERATION = 'report-generation',
  EMAIL_NOTIFICATION = 'email-notifications',
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 15,
}

// String to JobPriority mapping for convenience
export const JobPriorityMap = {
  low: JobPriority.LOW,
  normal: JobPriority.NORMAL,
  medium: JobPriority.NORMAL, // Alias
  high: JobPriority.HIGH,
  critical: JobPriority.CRITICAL,
} as const;

export type JobPriorityString = keyof typeof JobPriorityMap;

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
}

// Base job data interface
export interface BaseJobData {
  organizationId: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Data Validation Job Types
export interface ProductionDataValidationJobData extends BaseJobData {
  wellId: string;
  productionRecordId: string;
  validationRules: string[];
  validationType?: 'daily_production' | 'monthly_summary' | 'annual_report';
  includeQualityChecks?: boolean;
  validateAgainstTargets?: boolean;
}

export interface WellDataValidationJobData extends BaseJobData {
  wellId: string;
  validationType:
    | 'integrity'
    | 'compliance'
    | 'performance'
    | 'equipment_status';
  includeMetrics?: boolean;
  alertOnAnomalies?: boolean;
}

export interface LeaseDataValidationJobData extends BaseJobData {
  leaseId: string;
  validationType: 'ownership' | 'revenue' | 'compliance' | 'production_data';
  includeHistorical?: boolean;
  notifyOnFailure?: boolean;
}

// Report Generation Job Types
export interface FormPRReportJobData extends BaseJobData {
  wellIds: string[];
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  reportFormat: 'pdf' | 'excel' | 'csv';
  deliveryMethod: 'email' | 'download' | 'api';
}

export interface JIBStatementJobData extends BaseJobData {
  leaseId: string;
  statementPeriod: {
    startDate: Date;
    endDate: Date;
  };
  includeDetails: boolean;
  recipientEmails: string[];
}

export interface ProductionSummaryJobData extends BaseJobData {
  wellIds?: string[];
  leaseIds?: string[];
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  aggregationType: 'daily' | 'monthly' | 'quarterly' | 'annual';
}

export interface ComplianceReportJobData extends BaseJobData {
  reportType:
    | 'monthly_compliance'
    | 'quarterly_compliance'
    | 'annual_compliance';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  includeCharts?: boolean;
  format: 'pdf' | 'excel' | 'csv';
  recipients: string[];
  autoSubmit?: boolean;
}

// Email Notification Job Types
export interface ComplianceReminderJobData extends BaseJobData {
  reminderType:
    | 'form_pr_due'
    | 'jib_statement_due'
    | 'permit_renewal'
    | 'inspection_due';
  dueDate: Date;
  recipientEmails: string[];
  wellIds?: string[];
  leaseIds?: string[];
}

export interface ProductionAlertJobData extends BaseJobData {
  alertType: 'low_production' | 'equipment_failure' | 'anomaly_detected';
  wellId: string;
  alertData: {
    currentValue: number;
    expectedValue: number;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  recipientEmails: string[];
}

export interface SystemNotificationJobData extends BaseJobData {
  notificationType?: 'system_maintenance' | 'data_backup' | 'security_alert';
  message: string;
  recipientEmails: string[];
  priority: JobPriority | JobPriorityString;
  templateId?: string;
  templateData?: Record<string, unknown>;
}

// Union types for job data
export type DataValidationJobData =
  | ProductionDataValidationJobData
  | WellDataValidationJobData
  | LeaseDataValidationJobData;

export type ReportGenerationJobData =
  | FormPRReportJobData
  | JIBStatementJobData
  | ProductionSummaryJobData
  | ComplianceReportJobData;

export type EmailNotificationJobData =
  | ComplianceReminderJobData
  | ProductionAlertJobData
  | SystemNotificationJobData;

export type AllJobData =
  | DataValidationJobData
  | ReportGenerationJobData
  | EmailNotificationJobData;

// Job result interfaces
export interface JobResult {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: string[];
  processingTime?: number;
}

export interface ValidationJobResult extends JobResult {
  validationResults: {
    passed: boolean;
    errors: string[];
    warnings: string[];
    validatedFields: string[];
  };
}

export interface ReportJobResult extends JobResult {
  reportId: string;
  reportUrl?: string;
  reportSize?: number;
  generatedAt: Date;
}

export interface NotificationJobResult extends JobResult {
  sentTo: string[];
  failedRecipients: string[];
  messageId?: string;
}

// Job options interface
export interface JobOptions {
  priority?: JobPriority;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
  repeat?: {
    pattern?: string; // cron pattern
    every?: number; // milliseconds
    limit?: number;
  };
}
