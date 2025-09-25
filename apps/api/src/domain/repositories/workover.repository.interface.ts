import { Workover } from '../entities/workover.entity';
import { WorkoverStatus } from '../enums/workover-status.enum';

export interface IWorkoverRepository {
  save(workover: Workover): Promise<Workover>;
  findById(id: string): Promise<Workover | null>;
  findByOrganizationId(
    organizationId: string,
    options?: {
      status?: WorkoverStatus;
      wellId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Workover[]>;
  findByWellId(wellId: string): Promise<Workover[]>;
}
