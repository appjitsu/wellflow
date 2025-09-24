/**
 * Lease Operating Statement Status Enumeration
 * Defines the valid states for a Lease Operating Statement lifecycle
 */
export enum LosStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
  DISTRIBUTED = 'distributed',
  ARCHIVED = 'archived',
}

/**
 * Expense Category Enumeration
 * Defines the standard categories for operating expenses
 */
export enum ExpenseCategory {
  // Operating Expenses
  LABOR = 'labor',
  UTILITIES = 'utilities',
  MAINTENANCE = 'maintenance',
  SUPPLIES = 'supplies',
  TRANSPORTATION = 'transportation',
  INSURANCE = 'insurance',
  TAXES = 'taxes',
  REGULATORY = 'regulatory',
  ENVIRONMENTAL = 'environmental',
  SECURITY = 'security',

  // Capital Expenses
  EQUIPMENT = 'equipment',
  FACILITIES = 'facilities',
  DRILLING = 'drilling',
  COMPLETION = 'completion',
  WORKOVER = 'workover',
  INFRASTRUCTURE = 'infrastructure',

  // Other
  OVERHEAD = 'overhead',
  MISCELLANEOUS = 'miscellaneous',
}

/**
 * Expense Type Enumeration
 * Distinguishes between operating and capital expenses
 */
export enum ExpenseType {
  OPERATING = 'operating',
  CAPITAL = 'capital',
}
