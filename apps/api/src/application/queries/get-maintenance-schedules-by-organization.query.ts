export class GetMaintenanceSchedulesByOrganizationQuery {
  constructor(
    public readonly organizationId: string,
    public readonly options?: {
      limit?: number;
      offset?: number;
      equipmentId?: string;
      status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    },
  ) {}
}
