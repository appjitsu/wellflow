import { ApiProperty } from '@nestjs/swagger';
import type { MaintenanceStatus } from '../../domain/entities/maintenance-schedule.entity';

export class CompleteMaintenanceScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    enum: ['completed'],
    default: 'completed',
    example: 'completed',
  })
  status!: 'completed';
}

export class CreateMaintenanceScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

export class MaintenanceScheduleViewDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  equipmentId!: string;

  @ApiProperty({ enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] })
  status!: MaintenanceStatus;
}
