/**
 * Query to list permits with filtering and pagination
 */
export class ListPermitsQuery {
  constructor(
    public readonly organizationId: string,
    public readonly filters?: {
      status?: string;
      permitType?: string;
      wellId?: string;
      issuingAgency?: string;
      expiringWithinDays?: number;
      requiresRenewal?: boolean;
    },
    public readonly pagination?: {
      page?: number;
      limit?: number;
    },
    public readonly sort?: {
      field?: string;
      direction?: 'asc' | 'desc';
    },
  ) {}
}
