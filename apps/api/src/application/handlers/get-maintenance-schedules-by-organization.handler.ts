import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetMaintenanceSchedulesByOrganizationQuery } from '../queries/get-maintenance-schedules-by-organization.query';
import type { IMaintenanceScheduleRepository } from '../../domain/repositories/maintenance-schedule.repository.interface';

@QueryHandler(GetMaintenanceSchedulesByOrganizationQuery)
export class GetMaintenanceSchedulesByOrganizationHandler
  implements IQueryHandler<GetMaintenanceSchedulesByOrganizationQuery>
{
  constructor(
    @Inject('MaintenanceScheduleRepository')
    private readonly repo: IMaintenanceScheduleRepository,
  ) {}
  async execute(q: GetMaintenanceSchedulesByOrganizationQuery) {
    const items = await this.repo.findByOrganizationId(q.organizationId, {
      limit: q.options?.limit,
      offset: q.options?.offset,
      equipmentId: q.options?.equipmentId,
      status: q.options?.status,
    });
    return items.map((r) => ({
      id: r.getId(),
      organizationId: r.getOrganizationId(),
      equipmentId: r.getEquipmentId(),
      vendorId: r.getVendorId(),
      status: r.getStatus(),
    }));
  }
}
