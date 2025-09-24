import { IQuery } from '@nestjs/cqrs';
import {
  VendorStatus,
  VendorType,
  VendorRating,
} from '../../domain/enums/vendor-status.enum';

export interface VendorFilters {
  status?: VendorStatus[];
  vendorType?: VendorType[];
  isPrequalified?: boolean;
  hasValidInsurance?: boolean;
  performanceRating?: VendorRating[];
  searchTerm?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Get Vendors by Organization Query
 * Query to retrieve all vendors for an organization with filtering and pagination
 */
export class GetVendorsByOrganizationQuery implements IQuery {
  constructor(
    public readonly organizationId: string,
    public readonly filters?: VendorFilters,
    public readonly pagination?: PaginationOptions,
  ) {}
}
