import { WorkoverStatus } from '../../domain/enums/workover-status.enum';

export class GetWorkoversByOrganizationQuery {
  constructor(
    public readonly organizationId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: { status?: WorkoverStatus; wellId?: string },
  ) {}
}
