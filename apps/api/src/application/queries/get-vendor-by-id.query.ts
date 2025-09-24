import { IQuery } from '@nestjs/cqrs';

/**
 * Get Vendor by ID Query
 * Query to retrieve a specific vendor by its ID
 */
export class GetVendorByIdQuery implements IQuery {
  constructor(public readonly vendorId: string) {}
}
