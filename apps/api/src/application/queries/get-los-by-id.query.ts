import { IQuery } from '@nestjs/cqrs';

/**
 * Get LOS by ID Query
 * Query to retrieve a specific Lease Operating Statement by its ID
 */
export class GetLosByIdQuery implements IQuery {
  constructor(public readonly losId: string) {}
}
