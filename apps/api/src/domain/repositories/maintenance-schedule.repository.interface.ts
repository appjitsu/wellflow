import { MaintenanceSchedule } from '../entities/maintenance-schedule.entity';

export interface IMaintenanceScheduleRepository {
  save(ms: MaintenanceSchedule): Promise<MaintenanceSchedule>;
  findById(id: string): Promise<MaintenanceSchedule | null>;
  findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      equipmentId?: string;
      status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    },
  ): Promise<MaintenanceSchedule[]>;
}
