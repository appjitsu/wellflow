import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetMaintenanceScheduleByIdQuery } from '../queries/get-maintenance-schedule-by-id.query';
import type { IMaintenanceScheduleRepository } from '../../domain/repositories/maintenance-schedule.repository.interface';

@QueryHandler(GetMaintenanceScheduleByIdQuery)
export class GetMaintenanceScheduleByIdHandler
  implements IQueryHandler<GetMaintenanceScheduleByIdQuery>
{
  constructor(
    @Inject('MaintenanceScheduleRepository')
    private readonly repo: IMaintenanceScheduleRepository,
  ) {}
  async execute(query: GetMaintenanceScheduleByIdQuery) {
    const found = await this.repo.findById(query.id);
    if (!found) return null;
    return {
      id: found.getId(),
      organizationId: found.getOrganizationId(),
      equipmentId: found.getEquipmentId(),
      vendorId: found.getVendorId(),
      status: found.getStatus(),
    };
  }
}
