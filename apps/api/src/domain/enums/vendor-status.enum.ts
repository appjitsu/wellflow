/**
 * Vendor Status Enum
 * Represents the current status of a vendor in the system
 */
export enum VendorStatus {
  PENDING = 'pending', // Initial status, awaiting approval
  UNDER_REVIEW = 'under_review', // Under detailed review
  PREQUALIFIED = 'prequalified', // Meets basic requirements, limited work
  APPROVED = 'approved', // Fully approved and active for all work
  REJECTED = 'rejected', // Rejected, cannot perform work
  SUSPENDED = 'suspended', // Temporarily suspended
  INACTIVE = 'inactive', // Inactive, not available for work
}

/**
 * Vendor Type Enum
 * Categorizes vendors by the type of services they provide
 */
export enum VendorType {
  SERVICE = 'service', // Service companies (drilling, completion, workover)
  SUPPLIER = 'supplier', // Equipment and material suppliers
  CONTRACTOR = 'contractor', // General contractors and construction
  CONSULTANT = 'consultant', // Professional services and consulting
  TRANSPORTATION = 'transportation', // Trucking and logistics
  MAINTENANCE = 'maintenance', // Equipment maintenance and repair
  ENVIRONMENTAL = 'environmental', // Environmental services and remediation
  LABORATORY = 'laboratory', // Testing and analysis services
}

/**
 * Vendor Rating Enum
 * Performance rating scale for vendor evaluations
 */
export enum VendorRating {
  NOT_RATED = 'not_rated', // No rating assigned yet
  EXCELLENT = 'excellent', // 5 stars - Outstanding performance
  GOOD = 'good', // 4 stars - Above average performance
  SATISFACTORY = 'satisfactory', // 3 stars - Meets expectations
  POOR = 'poor', // 2 stars - Below expectations
  UNACCEPTABLE = 'unacceptable', // 1 star - Unacceptable performance
}

/**
 * Vendor Qualification Status Enum
 * Tracks the qualification status of vendors
 */
export enum VendorQualificationStatus {
  NOT_QUALIFIED = 'not_qualified', // Not yet qualified
  IN_PROGRESS = 'in_progress', // Qualification in progress
  QUALIFIED = 'qualified', // Fully qualified
  EXPIRED = 'expired', // Qualification expired
  SUSPENDED = 'suspended', // Qualification suspended
}

/**
 * Insurance Type Enum
 * Types of insurance coverage required for vendors
 */
export enum InsuranceType {
  GENERAL_LIABILITY = 'general_liability',
  WORKERS_COMPENSATION = 'workers_compensation',
  AUTO_LIABILITY = 'auto_liability',
  PROFESSIONAL_LIABILITY = 'professional_liability',
  ENVIRONMENTAL_LIABILITY = 'environmental_liability',
  UMBRELLA = 'umbrella',
}

/**
 * Certification Type Enum
 * Types of certifications relevant to oil & gas operations
 */
export enum CertificationType {
  SAFETY = 'safety', // General safety certifications
  OSHA = 'osha', // OSHA certifications
  ISN = 'isn', // ISNetworld certifications
  AVETTA = 'avetta', // Avetta certifications
  PEC = 'pec', // PEC Safety certifications
  TWIC = 'twic', // Transportation Worker ID
  H2S = 'h2s', // Hydrogen Sulfide safety
  CONFINED_SPACE = 'confined_space', // Confined space entry
  CRANE_OPERATOR = 'crane_operator', // Crane operation certifications
  WELDING = 'welding', // Welding certifications
  ENVIRONMENTAL = 'environmental', // Environmental certifications
  QUALITY = 'quality', // Quality management (ISO, etc.)
}

/**
 * Service Category Enum
 * Categories of services provided by vendors
 */
export enum ServiceCategory {
  DRILLING = 'drilling', // Drilling services
  COMPLETION = 'completion', // Well completion services
  WORKOVER = 'workover', // Well workover and intervention
  PRODUCTION = 'production', // Production services
  FACILITIES = 'facilities', // Facility construction and maintenance
  TRANSPORTATION = 'transportation', // Trucking and logistics
  ENVIRONMENTAL = 'environmental', // Environmental services
  CONSULTING = 'consulting', // Professional consulting
  LABORATORY = 'laboratory', // Testing and analysis
  MAINTENANCE = 'maintenance', // Equipment maintenance
  CONSTRUCTION = 'construction', // General construction
  ELECTRICAL = 'electrical', // Electrical services
  INSTRUMENTATION = 'instrumentation', // Instrumentation and controls
}

/**
 * Contract Status Enum
 * Status of vendor contracts
 */
export enum ContractStatus {
  DRAFT = 'draft', // Contract being drafted
  PENDING_APPROVAL = 'pending_approval', // Awaiting approval
  ACTIVE = 'active', // Active contract
  EXPIRED = 'expired', // Contract expired
  TERMINATED = 'terminated', // Contract terminated
  SUSPENDED = 'suspended', // Contract suspended
}

/**
 * Performance Metric Type Enum
 * Types of performance metrics tracked for vendors
 */
export enum PerformanceMetricType {
  OVERALL = 'overall', // Overall performance rating
  SAFETY = 'safety', // Safety performance
  QUALITY = 'quality', // Quality of work
  TIMELINESS = 'timeliness', // On-time performance
  COST_EFFECTIVENESS = 'cost_effectiveness', // Cost performance
  COMMUNICATION = 'communication', // Communication effectiveness
  COMPLIANCE = 'compliance', // Regulatory compliance
}

/**
 * Vendor Event Type Enum
 * Types of events that can occur with vendors
 */
export enum VendorEventType {
  CREATED = 'created', // Vendor created
  APPROVED = 'approved', // Vendor approved
  REJECTED = 'rejected', // Vendor rejected
  SUSPENDED = 'suspended', // Vendor suspended
  REACTIVATED = 'reactivated', // Vendor reactivated
  INSURANCE_UPDATED = 'insurance_updated', // Insurance information updated
  CERTIFICATION_ADDED = 'certification_added', // Certification added
  CERTIFICATION_EXPIRED = 'certification_expired', // Certification expired
  PERFORMANCE_RATED = 'performance_rated', // Performance rating updated
  CONTRACT_SIGNED = 'contract_signed', // Contract signed
  CONTRACT_EXPIRED = 'contract_expired', // Contract expired
}
