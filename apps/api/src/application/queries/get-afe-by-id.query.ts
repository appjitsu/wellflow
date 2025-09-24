import { IQuery } from '@nestjs/cqrs';

/**
 * Get AFE By ID Query
 * Query to retrieve an AFE by its ID
 */
export class GetAfeByIdQuery implements IQuery {
  constructor(public readonly afeId: string) {}
}
