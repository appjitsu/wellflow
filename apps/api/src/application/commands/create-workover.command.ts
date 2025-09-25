import { WorkoverStatus } from '../../domain/enums/workover-status.enum';

export class CreateWorkoverCommand {
  constructor(
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly options?: {
      afeId?: string;
      reason?: string;
      status?: WorkoverStatus;
      startDate?: string; // ISO
      endDate?: string; // ISO
      preProductionSnapshot?: Record<string, unknown>;
      postProductionSnapshot?: Record<string, unknown>;
    },
  ) {}
}
