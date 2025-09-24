import { Injectable } from '@nestjs/common';
import { Afe } from '../entities/afe.entity';
import { AfeApprovalStatus } from '../enums/afe-status.enum';
import { Money } from '../value-objects/money';

export interface AfeApproval {
  id: string;
  afeId: string;
  partnerId: string;
  approvalStatus: AfeApprovalStatus;
  approvedAmount?: Money;
  approvalDate?: Date;
  comments?: string;
  approvedByUserId?: string;
}

export interface PartnerApprovalRequirement {
  partnerId: string;
  partnerName: string;
  workingInterest: number;
  approvalThreshold: number; // Minimum amount requiring approval
  isRequired: boolean;
}

export interface ApprovalWorkflowResult {
  isComplete: boolean;
  isApproved: boolean;
  pendingApprovals: PartnerApprovalRequirement[];
  completedApprovals: AfeApproval[];
  totalApprovedAmount?: Money;
  rejectionReasons?: string[];
}

/**
 * AFE Approval Workflow Service
 * Manages the approval process for AFEs including partner consent
 *
 * Business Rules:
 * - AFEs over $50,000 require partner approval
 * - Partners with >25% working interest must approve
 * - Majority consent (>50% by working interest) required
 * - Conditional approvals allowed with reduced amounts
 */
@Injectable()
export class AfeApprovalWorkflowService {
  private readonly APPROVAL_THRESHOLD = 50000; // $50,000
  private readonly MAJOR_PARTNER_THRESHOLD = 0.25; // 25% working interest
  private readonly MAJORITY_CONSENT_THRESHOLD = 0.5; // 50% working interest

  /**
   * Determine if AFE requires partner approval
   */
  requiresPartnerApproval(afe: Afe): boolean {
    const estimatedCost = afe.getTotalEstimatedCost();
    if (!estimatedCost) {
      return false;
    }

    return estimatedCost.getAmount() >= this.APPROVAL_THRESHOLD;
  }

  /**
   * Get partner approval requirements for an AFE
   */
  getApprovalRequirements(
    afe: Afe,
    partners: Array<{
      id: string;
      name: string;
      workingInterest: number;
    }>,
  ): PartnerApprovalRequirement[] {
    if (!this.requiresPartnerApproval(afe)) {
      return [];
    }

    const estimatedCost = afe.getTotalEstimatedCost();
    const approvalThreshold = estimatedCost ? estimatedCost.getAmount() : 0;

    return partners.map((partner) => ({
      partnerId: partner.id,
      partnerName: partner.name,
      workingInterest: partner.workingInterest,
      approvalThreshold,
      isRequired: partner.workingInterest >= this.MAJOR_PARTNER_THRESHOLD,
    }));
  }

  /**
   * Evaluate approval workflow status
   */
  evaluateApprovalWorkflow(
    afe: Afe,
    approvals: AfeApproval[],
    partnerRequirements: PartnerApprovalRequirement[],
  ): ApprovalWorkflowResult {
    if (!this.requiresPartnerApproval(afe)) {
      return {
        isComplete: true,
        isApproved: true,
        pendingApprovals: [],
        completedApprovals: [],
      };
    }

    const completedApprovals = approvals.filter(
      (approval) => approval.approvalStatus !== AfeApprovalStatus.PENDING,
    );

    const pendingApprovals = partnerRequirements.filter(
      (req) =>
        !completedApprovals.some(
          (approval) => approval.partnerId === req.partnerId,
        ),
    );

    // Calculate approval statistics
    const approvedApprovals = completedApprovals.filter(
      (approval) => approval.approvalStatus === AfeApprovalStatus.APPROVED,
    );

    const rejectedApprovals = completedApprovals.filter(
      (approval) => approval.approvalStatus === AfeApprovalStatus.REJECTED,
    );

    // Calculate working interest percentages
    const totalWorkingInterest = partnerRequirements.reduce(
      (sum, req) => sum + req.workingInterest,
      0,
    );

    const approvedWorkingInterest = approvedApprovals.reduce(
      (sum, approval) => {
        const requirement = partnerRequirements.find(
          (req) => req.partnerId === approval.partnerId,
        );
        return sum + (requirement?.workingInterest || 0);
      },
      0,
    );

    const rejectedWorkingInterest = rejectedApprovals.reduce(
      (sum, approval) => {
        const requirement = partnerRequirements.find(
          (req) => req.partnerId === approval.partnerId,
        );
        return sum + (requirement?.workingInterest || 0);
      },
      0,
    );

    // Check if all required partners have responded
    const requiredPartners = partnerRequirements.filter(
      (req) => req.isRequired,
    );
    const requiredPartnersResponded = requiredPartners.every((req) =>
      completedApprovals.some(
        (approval) => approval.partnerId === req.partnerId,
      ),
    );

    // Determine if workflow is complete and approved
    const approvalPercentage = approvedWorkingInterest / totalWorkingInterest;
    const rejectionPercentage = rejectedWorkingInterest / totalWorkingInterest;

    const isApproved =
      requiredPartnersResponded &&
      approvalPercentage >= this.MAJORITY_CONSENT_THRESHOLD &&
      rejectionPercentage < this.MAJORITY_CONSENT_THRESHOLD;

    const isRejected =
      rejectionPercentage >= this.MAJORITY_CONSENT_THRESHOLD ||
      requiredPartners.some((req) => {
        const approval = completedApprovals.find(
          (a) => a.partnerId === req.partnerId,
        );
        return approval?.approvalStatus === AfeApprovalStatus.REJECTED;
      });

    const isComplete =
      isApproved || isRejected || pendingApprovals.length === 0;

    // Calculate total approved amount
    let totalApprovedAmount: Money | undefined;
    if (approvedApprovals.length > 0) {
      const amounts = approvedApprovals
        .map((approval) => approval.approvedAmount)
        .filter((amount): amount is Money => amount !== undefined);

      if (amounts.length > 0) {
        totalApprovedAmount = amounts.reduce(
          (sum, amount) => sum.add(amount),
          Money.zero(),
        );
      }
    }

    // Collect rejection reasons
    const rejectionReasons = rejectedApprovals
      .map((approval) => approval.comments)
      .filter((comment): comment is string => comment !== undefined);

    return {
      isComplete,
      isApproved: isComplete && isApproved,
      pendingApprovals,
      completedApprovals,
      totalApprovedAmount,
      rejectionReasons:
        rejectionReasons.length > 0 ? rejectionReasons : undefined,
    };
  }

  /**
   * Validate partner approval
   */
  validatePartnerApproval(
    approval: Partial<AfeApproval>,
    partnerRequirement: PartnerApprovalRequirement,
  ): void {
    if (
      !approval.partnerId ||
      approval.partnerId !== partnerRequirement.partnerId
    ) {
      throw new Error('Invalid partner ID for approval');
    }

    if (!approval.approvalStatus) {
      throw new Error('Approval status is required');
    }

    if (
      approval.approvalStatus === AfeApprovalStatus.APPROVED &&
      approval.approvedAmount &&
      approval.approvedAmount.getAmount() > partnerRequirement.approvalThreshold
    ) {
      throw new Error(
        'Approved amount cannot exceed the original AFE estimated cost',
      );
    }

    if (
      approval.approvalStatus === AfeApprovalStatus.REJECTED &&
      !approval.comments
    ) {
      throw new Error('Rejection reason is required');
    }
  }

  /**
   * Check if partner can approve AFE
   */
  canPartnerApprove(
    partnerId: string,
    partnerRequirements: PartnerApprovalRequirement[],
  ): boolean {
    return partnerRequirements.some((req) => req.partnerId === partnerId);
  }

  /**
   * Get approval deadline for AFE
   */
  getApprovalDeadline(afe: Afe): Date {
    const createdAt = afe.getCreatedAt();
    const deadline = new Date(createdAt);

    // Standard 30-day approval period
    deadline.setDate(deadline.getDate() + 30);

    return deadline;
  }

  /**
   * Check if approval is overdue
   */
  isApprovalOverdue(afe: Afe): boolean {
    const deadline = this.getApprovalDeadline(afe);
    return new Date() > deadline;
  }
}
