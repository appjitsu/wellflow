import { ICommand } from '@nestjs/cqrs';

/**
 * Submit AFE Command
 * Command to submit an AFE for approval
 */
export class SubmitAfeCommand implements ICommand {
  constructor(
    public readonly afeId: string,
    public readonly submittedBy: string,
  ) {}
}
