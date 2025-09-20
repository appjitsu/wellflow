import { IQuery } from '@nestjs/cqrs';

/**
 * Get Well By ID Query
 * Query to retrieve a well by its ID
 */
export class GetWellByIdQuery implements IQuery {
  constructor(public readonly wellId: string) {}
}
