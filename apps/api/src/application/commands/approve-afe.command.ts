import { ICommand } from '@nestjs/cqrs';

/**
 * Approve AFE Command
 * Command to approve an AFE
 */
export class ApproveAfeCommand implements ICommand {
  constructor(
    public readonly afeId: string,
    public readonly approvedBy: string,
    public readonly approvedAmount?: number,
    public readonly comments?: string,
  ) {}
}
