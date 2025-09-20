import { IQuery } from '@nestjs/cqrs';

/**
 * Get Wells By Operator Query
 * Query to retrieve wells by operator ID with pagination
 */
export class GetWellsByOperatorQuery implements IQuery {
  constructor(
    public readonly operatorId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: {
      status?: string;
      wellType?: string;
    },
  ) {}
}
