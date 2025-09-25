import { ApiProperty } from '@nestjs/swagger';
import { WorkoverStatus } from '../../domain/enums/workover-status.enum';

export class WorkoverDto {
  @ApiProperty() id!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() wellId!: string;
  @ApiProperty({ required: false }) afeId?: string | null;
  @ApiProperty({ required: false }) reason?: string | null;
  @ApiProperty({ enum: WorkoverStatus }) status!: WorkoverStatus;
  @ApiProperty({ required: false, type: String }) startDate?: string | null;
  @ApiProperty({ required: false, type: String }) endDate?: string | null;
  @ApiProperty({ required: false }) estimatedCost?: string | null;
  @ApiProperty({ required: false }) actualCost?: string | null;
  @ApiProperty({ required: false, type: Object })
  preProductionSnapshot?: Record<string, unknown> | null;
  @ApiProperty({ required: false, type: Object })
  postProductionSnapshot?: Record<string, unknown> | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
