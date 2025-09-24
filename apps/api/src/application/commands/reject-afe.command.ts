import { ICommand } from '@nestjs/cqrs';

/**
 * Reject AFE Command
 * Command to reject an AFE
 */
export class RejectAfeCommand implements ICommand {
  constructor(
    public readonly afeId: string,
    public readonly rejectedBy: string,
    public readonly reason?: string,
  ) {}
}
