import { IQuery } from '@nestjs/cqrs';

/**
 * Get AFEs Requiring Approval Query
 * Query to retrieve AFEs that require approval
 */
export class GetAfesRequiringApprovalQuery implements IQuery {
  constructor(public readonly organizationId: string) {}
}
