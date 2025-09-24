import { ICommand } from '@nestjs/cqrs';
import { AfeApprovalStatus } from '../../domain/enums/afe-status.enum';

/**
 * Create AFE Approval Command
 * Command to create a partner approval for an AFE
 */
export class CreateAfeApprovalCommand implements ICommand {
  constructor(
    public readonly afeId: string,
    public readonly partnerId: string,
    public readonly approvalStatus: AfeApprovalStatus,
    public readonly approvedAmount?: number,
    public readonly comments?: string,
    public readonly approvedByUserId?: string,
  ) {}
}
