import { ApiProperty } from '@nestjs/swagger';
import { DrillingProgramStatus } from '../../domain/enums/drilling-program-status.enum';

export class DrillingProgramDto {
  @ApiProperty() id!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() wellId!: string;
  @ApiProperty({ required: false }) afeId?: string | null;
  @ApiProperty() programName!: string;
  @ApiProperty() version!: number;
  @ApiProperty({ enum: DrillingProgramStatus }) status!: DrillingProgramStatus;
  @ApiProperty({ type: Object, required: false }) program?: Record<
    string,
    unknown
  > | null;
  @ApiProperty({ type: Object, required: false }) hazards?: Record<
    string,
    unknown
  > | null;
  @ApiProperty({ type: Array, required: false }) approvals?: Array<
    Record<string, unknown>
  > | null;
  @ApiProperty({ required: false }) estimatedCost?: string | null;
  @ApiProperty({ required: false }) actualCost?: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
