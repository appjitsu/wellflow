import { AfeApproval } from '../entities/afe-approval.entity';
import { AfeApprovalStatus } from '../enums/afe-status.enum';

/**
 * AFE Approval Repository Interface
 * Defines the contract for AFE approval data access operations
 */
export interface IAfeApprovalRepository {
  /**
   * Save an AFE approval entity
   */
  save(approval: AfeApproval): Promise<AfeApproval>;

  /**
   * Find AFE approval by ID
   */
  findById(id: string): Promise<AfeApproval | null>;

  /**
   * Find AFE approval by AFE ID and partner ID
   */
  findByAfeAndPartner(
    afeId: string,
    partnerId: string,
  ): Promise<AfeApproval | null>;

  /**
   * Find all approvals for an AFE
   */
  findByAfeId(afeId: string): Promise<AfeApproval[]>;

  /**
   * Find approvals by partner ID
   */
  findByPartnerId(partnerId: string): Promise<AfeApproval[]>;

  /**
   * Find approvals by status
   */
  findByStatus(status: AfeApprovalStatus): Promise<AfeApproval[]>;

  /**
   * Find pending approvals for a partner
   */
  findPendingByPartnerId(partnerId: string): Promise<AfeApproval[]>;

  /**
   * Find overdue approvals (pending beyond deadline)
   */
  findOverdueApprovals(deadlineDate: Date): Promise<AfeApproval[]>;

  /**
   * Count approvals by criteria
   */
  count(criteria?: {
    afeId?: string;
    partnerId?: string;
    status?: AfeApprovalStatus;
  }): Promise<number>;

  /**
   * Delete AFE approval by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if approval exists for AFE and partner
   */
  existsByAfeAndPartner(afeId: string, partnerId: string): Promise<boolean>;
}
