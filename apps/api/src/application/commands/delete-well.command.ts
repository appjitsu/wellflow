import { ICommand } from '@nestjs/cqrs';

/**
 * Delete Well Command
 * Command to delete an existing well
 */
export class DeleteWellCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy?: string,
  ) {}
}
