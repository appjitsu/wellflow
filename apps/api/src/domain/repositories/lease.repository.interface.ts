/**
 * Lease Repository Interface
 * Defines the contract for lease data access
 */
export interface LeaseRepository {
  /**
   * Create a new lease
   */
  create(data: CreateLeaseDto): Promise<LeaseRecord>;

  /**
   * Find lease by ID
   */
  findById(id: string): Promise<LeaseRecord | null>;

  /**
   * Find all leases for an organization
   */
  findAll(organizationId: string): Promise<LeaseRecord[]>;

  /**
   * Find leases by status
   */
  findByStatus(organizationId: string, status: string): Promise<LeaseRecord[]>;

  /**
   * Find expiring leases
   */
  findExpiring(organizationId: string, days: number): Promise<LeaseRecord[]>;

  /**
   * Update lease
   */
  update(id: string, data: UpdateLeaseDto): Promise<LeaseRecord | null>;

  /**
   * Delete lease
   */
  delete(id: string): Promise<boolean>;
}

export interface CreateLeaseDto {
  name: string;
  leaseNumber?: string;
  lessor: string;
  lessee: string;
  acreage?: string;
  royaltyRate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  legalDescription?: string;
  organizationId: string;
}

export interface UpdateLeaseDto {
  name?: string;
  leaseNumber?: string;
  lessor?: string;
  lessee?: string;
  acreage?: string;
  royaltyRate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  status?: string;
  legalDescription?: string;
}

export interface LeaseRecord {
  id: string;
  organizationId: string;
  name: string;
  leaseNumber: string | null;
  lessor: string;
  lessee: string;
  acreage: string | null;
  royaltyRate: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  status: string;
  legalDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}
