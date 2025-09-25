export class MaintenanceScheduleCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly equipmentId: string,
    public readonly status: string,
  ) {}
}
