/**
 * AFE Status Enum
 * Represents the lifecycle status of an Authorization for Expenditure
 */
export enum AfeStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CLOSED = 'closed',
}

/**
 * AFE Type Enum
 * Represents the type of expenditure being authorized
 */
export enum AfeType {
  DRILLING = 'drilling',
  COMPLETION = 'completion',
  WORKOVER = 'workover',
  FACILITY = 'facility',
}

/**
 * AFE Line Item Category Enum
 * Represents categories for detailed cost breakdown
 */
export enum AfeLineItemCategory {
  DRILLING = 'drilling',
  COMPLETION = 'completion',
  EQUIPMENT = 'equipment',
  SERVICES = 'services',
  MATERIALS = 'materials',
  LABOR = 'labor',
  PERMITS = 'permits',
  TRANSPORTATION = 'transportation',
  OTHER = 'other',
}

/**
 * AFE Approval Status Enum
 * Represents the status of partner approvals
 */
export enum AfeApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONDITIONAL = 'conditional',
}
