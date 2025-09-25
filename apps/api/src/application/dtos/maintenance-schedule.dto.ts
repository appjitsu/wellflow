export interface MaintenanceScheduleDto {
  id: string;
  organizationId: string;
  equipmentId: string;
  vendorId?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}
