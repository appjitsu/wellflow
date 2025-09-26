import { ApiProperty } from '@nestjs/swagger';
import { Well } from '../../domain/entities/well.entity';
import { WellStatus, WellType } from '../../domain/enums/well-status.enum';

/**
 * Well Data Transfer Object
 * Used for API responses
 */
export class WellDto {
  @ApiProperty({ description: 'Well unique identifier' })
  id!: string;

  @ApiProperty({
    description: 'API Number (formatted)',
    example: '42-123-12345',
  })
  apiNumber!: string;

  @ApiProperty({ description: 'Well name' })
  name!: string;

  @ApiProperty({ description: 'Operator ID' })
  operatorId!: string;

  @ApiProperty({ description: 'Lease ID', required: false })
  leaseId?: string;

  @ApiProperty({ enum: WellType, description: 'Type of well' })
  wellType!: WellType;

  @ApiProperty({ enum: WellStatus, description: 'Current well status' })
  status!: WellStatus;

  @ApiProperty({ description: 'Well location' })
  location!: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    address?: string;
    county?: string;
    state?: string;
    country: string;
  };

  @ApiProperty({ description: 'Spud date', required: false })
  spudDate?: Date;

  @ApiProperty({ description: 'Completion date', required: false })
  completionDate?: Date;

  @ApiProperty({ description: 'Total depth in feet', required: false })
  totalDepth?: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Version for optimistic locking' })
  version!: number;

  static fromEntity(well: Well): WellDto {
    return {
      id: well.getId().getValue(),
      apiNumber: well.getApiNumber().getValue(),
      name: well.getName(),
      operatorId: well.getOperatorId(),
      leaseId: well.getLeaseId(),
      wellType: well.getWellType(),
      status: well.getStatus(),
      location: well.getLocation()?.toObject() || null,
      spudDate: well.getSpudDate(),
      completionDate: well.getCompletionDate(),
      totalDepth: well.getTotalDepth(),
      createdAt: well.getCreatedAt(),
      updatedAt: well.getUpdatedAt(),
      version: well.getVersion(),
    };
  }
}
