import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateJibLinkDto {
  @ApiProperty({ description: 'Organization ID', example: 'org-123' })
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({
    description: 'Annual interest rate percent (e.g., 12.00)',
    example: '12.00',
  })
  @IsNotEmpty()
  annualInterestRatePercent!: string;

  @ApiProperty({ enum: [360, 365], required: false, example: 365 })
  @IsEnum([360, 365] as const)
  dayCountBasis?: 360 | 365;
}
