import { Afe } from '../../domain/entities/afe.entity';
import { AfeStatus, AfeType } from '../../domain/enums/afe-status.enum';

/**
 * AFE Data Transfer Object
 * Used for API responses and data serialization
 */
export class AfeDto {
  id!: string;
  organizationId!: string;
  afeNumber!: string;
  wellId?: string;
  leaseId?: string;
  afeType!: AfeType;
  status!: AfeStatus;
  totalEstimatedCost?: {
    amount: number;
    currency: string;
  };
  approvedAmount?: {
    amount: number;
    currency: string;
  };
  actualCost?: {
    amount: number;
    currency: string;
  };
  effectiveDate?: Date;
  approvalDate?: Date;
  description?: string;
  createdAt!: Date;
  updatedAt!: Date;
  version!: number;

  constructor(data: Partial<AfeDto>) {
    Object.assign(this, data);
  }

  /**
   * Create DTO from domain entity
   */
  static fromEntity(afe: Afe): AfeDto {
    return new AfeDto({
      id: afe.getId(),
      organizationId: afe.getOrganizationId(),
      afeNumber: afe.getAfeNumber().getValue(),
      wellId: afe.getWellId(),
      leaseId: afe.getLeaseId(),
      afeType: afe.getAfeType(),
      status: afe.getStatus(),
      totalEstimatedCost: afe.getTotalEstimatedCost()?.toJSON(),
      approvedAmount: afe.getApprovedAmount()?.toJSON(),
      actualCost: afe.getActualCost()?.toJSON(),
      effectiveDate: afe.getEffectiveDate(),
      approvalDate: afe.getApprovalDate(),
      description: afe.getDescription(),
      createdAt: afe.getCreatedAt(),
      updatedAt: afe.getUpdatedAt(),
      version: afe.getVersion(),
    });
  }

  /**
   * Create multiple DTOs from domain entities
   */
  static fromEntities(afes: Afe[]): AfeDto[] {
    return afes.map((afe) => AfeDto.fromEntity(afe));
  }
}
