import {
  maintenanceStatusEnum,
  maintenanceTypeEnum,
} from '../../database/schemas/maintenance-schedules';

export type MaintenanceType = (typeof maintenanceTypeEnum.enumValues)[number];
export type MaintenanceStatus =
  (typeof maintenanceStatusEnum.enumValues)[number];

export class MaintenanceSchedule {
  private static readonly allowedTypes = new Set<MaintenanceType>(
    maintenanceTypeEnum.enumValues,
  );
  private static readonly allowedStatuses = new Set<MaintenanceStatus>(
    maintenanceStatusEnum.enumValues,
  );

  constructor(
    private props: {
      id: string;
      organizationId: string;
      equipmentId: string;
      vendorId?: string;
      maintenanceType?: MaintenanceType;
      scheduleDate?: Date;
      workOrderNumber?: string;
      status?: MaintenanceStatus;
      estimatedCost?: number;
      actualCost?: number;
      downtimeHours?: number;
      notes?: string;
    },
  ) {
    if (
      props.maintenanceType &&
      !MaintenanceSchedule.allowedTypes.has(props.maintenanceType)
    ) {
      throw new Error(`Invalid maintenance type: ${props.maintenanceType}`);
    }

    if (
      props.status &&
      !MaintenanceSchedule.allowedStatuses.has(props.status)
    ) {
      throw new Error(`Invalid maintenance status: ${props.status}`);
    }
  }
  getId() {
    return this.props.id;
  }
  getOrganizationId() {
    return this.props.organizationId;
  }
  getEquipmentId() {
    return this.props.equipmentId;
  }
  getVendorId() {
    return this.props.vendorId;
  }
  getStatus() {
    return this.props.status ?? 'scheduled';
  }
}
