import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsObject,
  IsNumber,
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PermitTypeEnum {
  DRILLING = 'drilling',
  COMPLETION = 'completion',
  WORKOVER = 'workover',
  INJECTION = 'injection',
  DISPOSAL = 'disposal',
  FACILITY = 'facility',
  PIPELINE = 'pipeline',
  ENVIRONMENTAL = 'environmental',
}

export class CreatePermitDto {
  @ApiProperty({
    description: 'Type of permit being applied for',
    enum: PermitTypeEnum,
    example: PermitTypeEnum.DRILLING,
  })
  @IsEnum(PermitTypeEnum)
  permitType!: string;

  @ApiProperty({
    description: 'Issuing regulatory agency',
    example: 'Texas Railroad Commission',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  issuingAgency!: string;

  @ApiPropertyOptional({
    description: 'Regulatory authority overseeing the permit',
    example: 'Texas Department of Licensing and Regulation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  regulatoryAuthority?: string;

  @ApiPropertyOptional({
    description: 'ID of the well this permit is for',
    example: 'well-123',
  })
  @IsOptional()
  @IsUUID()
  wellId?: string;

  @ApiPropertyOptional({
    description: 'ID of the facility this permit is for',
    example: 'facility-456',
  })
  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @ApiPropertyOptional({
    description: 'Geographic location information',
    example: {
      latitude: 31.9686,
      longitude: -99.9018,
      address: '123 Main St, Austin, TX 78701',
      county: 'Travis',
      state: 'TX',
    },
  })
  @IsOptional()
  @IsObject()
  location?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Date when permit application was submitted',
  })
  @IsOptional()
  @IsDateString()
  applicationDate?: string;

  @ApiPropertyOptional({
    description: 'Date when permit was submitted for review',
  })
  @IsOptional()
  @IsDateString()
  submittedDate?: string;

  @ApiPropertyOptional({
    description: 'Date when permit was approved',
  })
  @IsOptional()
  @IsDateString()
  approvalDate?: string;

  @ApiPropertyOptional({
    description: 'Expiration date of the permit',
  })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({
    description: 'Permit conditions and requirements',
    example: {
      operatingHours: '24/7',
      emissionLimits: 'SO2 < 500 ppm',
      monitoringRequirements: 'Monthly sampling',
    },
  })
  @IsOptional()
  @IsObject()
  permitConditions?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Compliance requirements for the permit',
    example: {
      reportingFrequency: 'monthly',
      recordRetention: '5 years',
      inspectionSchedule: 'quarterly',
    },
  })
  @IsOptional()
  @IsObject()
  complianceRequirements?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Permit application fee amount',
    example: 1500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  feeAmount?: number;

  @ApiPropertyOptional({
    description: 'Bond amount required for the permit',
    example: 10000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bondAmount?: number;

  @ApiPropertyOptional({
    description: 'Type of bond (surety, cash, letter of credit)',
    example: 'surety',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bondType?: string;

  @ApiPropertyOptional({
    description: 'Array of document IDs attached to the permit application',
    example: ['doc-123', 'doc-456', 'doc-789'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  documentIds?: string[];
}
