export class MaintenanceScheduleCompletedEvent {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly equipmentId: string,
    public readonly completedAt: string,
  ) {}
}
