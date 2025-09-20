/**
 * Well Status Enumeration
 * Represents the various states a well can be in during its lifecycle
 */
export enum WellStatus {
  PLANNED = 'PLANNED',
  PERMITTED = 'PERMITTED',
  DRILLING = 'DRILLING',
  COMPLETED = 'COMPLETED',
  PRODUCING = 'PRODUCING',
  SHUT_IN = 'SHUT_IN',
  TEMPORARILY_ABANDONED = 'TEMPORARILY_ABANDONED',
  PERMANENTLY_ABANDONED = 'PERMANENTLY_ABANDONED',
  PLUGGED = 'PLUGGED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Well Type Enumeration
 */
export enum WellType {
  OIL = 'OIL',
  GAS = 'GAS',
  OIL_AND_GAS = 'OIL_AND_GAS',
  INJECTION = 'INJECTION',
  DISPOSAL = 'DISPOSAL',
  WATER = 'WATER',
  OTHER = 'OTHER',
}

/**
 * Production Status Enumeration
 */
export enum ProductionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SHUT_IN = 'SHUT_IN',
  ABANDONED = 'ABANDONED',
}

/**
 * Lease Status Enumeration
 */
export enum LeaseStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  SUSPENDED = 'SUSPENDED',
}
