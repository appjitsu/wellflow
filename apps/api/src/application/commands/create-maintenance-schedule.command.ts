import { CreateMaintenanceScheduleDto } from '../dtos/create-maintenance-schedule.dto';
export class CreateMaintenanceScheduleCommand {
  constructor(public readonly dto: CreateMaintenanceScheduleDto) {}
}
