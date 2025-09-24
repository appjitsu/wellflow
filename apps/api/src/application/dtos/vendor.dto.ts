import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  ValidateNested,
  IsUrl,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  VendorType,
  VendorStatus,
  VendorRating,
} from '../../domain/enums/vendor-status.enum';

// Address DTO
export class AddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  @Length(1, 255)
  street!: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @Length(1, 100)
  city!: string;

  @ApiProperty({ description: 'State or province' })
  @IsString()
  @Length(1, 50)
  state!: string;

  @ApiProperty({ description: 'ZIP or postal code' })
  @IsString()
  @Length(1, 20)
  zipCode!: string;

  @ApiProperty({ description: 'Country', default: 'USA' })
  @IsString()
  @Length(1, 50)
  country!: string;
}

// Insurance Policy DTO
export class InsurancePolicyDto {
  @ApiProperty({ description: 'Insurance carrier name' })
  @IsString()
  @Length(1, 255)
  carrier!: string;

  @ApiProperty({ description: 'Policy number' })
  @IsString()
  @Length(1, 100)
  policyNumber!: string;

  @ApiProperty({ description: 'Coverage amount in USD' })
  @IsNumber()
  @Min(0)
  coverageAmount!: number;

  @ApiProperty({ description: 'Policy expiration date' })
  @IsDateString()
  expirationDate!: string;
}

// Insurance DTO
export class InsuranceDto {
  @ApiProperty({
    description: 'General liability insurance',
    type: InsurancePolicyDto,
  })
  @ValidateNested()
  @Type(() => InsurancePolicyDto)
  generalLiability!: InsurancePolicyDto;

  @ApiPropertyOptional({
    description: 'Workers compensation insurance',
    type: InsurancePolicyDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InsurancePolicyDto)
  workersCompensation?: InsurancePolicyDto;

  @ApiPropertyOptional({
    description: 'Auto liability insurance',
    type: InsurancePolicyDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InsurancePolicyDto)
  autoLiability?: InsurancePolicyDto;

  @ApiPropertyOptional({
    description: 'Professional liability insurance',
    type: InsurancePolicyDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InsurancePolicyDto)
  professionalLiability?: InsurancePolicyDto;

  @ApiPropertyOptional({
    description: 'Environmental liability insurance',
    type: InsurancePolicyDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InsurancePolicyDto)
  environmentalLiability?: InsurancePolicyDto;

  @ApiPropertyOptional({
    description: 'Umbrella insurance',
    type: InsurancePolicyDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InsurancePolicyDto)
  umbrella?: InsurancePolicyDto;
}

// Certification DTO
export class CertificationDto {
  @ApiProperty({ description: 'Certification name' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiProperty({ description: 'Issuing body or organization' })
  @IsString()
  @Length(1, 255)
  issuingBody!: string;

  @ApiProperty({ description: 'Certification number' })
  @IsString()
  @Length(1, 100)
  certificationNumber!: string;

  @ApiProperty({ description: 'Issue date' })
  @IsDateString()
  issueDate!: string;

  @ApiProperty({ description: 'Expiration date' })
  @IsDateString()
  expirationDate!: string;

  @ApiPropertyOptional({ description: 'Document file path' })
  @IsOptional()
  @IsString()
  documentPath?: string;
}

// Create Vendor DTO
export class CreateVendorDto {
  @ApiProperty({ description: 'Vendor name' })
  @IsString()
  @Length(1, 255)
  vendorName!: string;

  @ApiProperty({ description: 'Unique vendor code' })
  @IsString()
  @Length(3, 50)
  vendorCode!: string;

  @ApiProperty({ description: 'Vendor type', enum: VendorType })
  @IsEnum(VendorType)
  vendorType!: VendorType;

  @ApiProperty({ description: 'Billing address', type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress!: AddressDto;

  @ApiProperty({ description: 'Payment terms (e.g., Net 30)' })
  @IsString()
  @Length(1, 50)
  paymentTerms!: string;

  @ApiPropertyOptional({ description: 'Tax ID or EIN' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  taxId?: string;

  @ApiPropertyOptional({ description: 'Service address', type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  serviceAddress?: AddressDto;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Update Vendor DTO
export class UpdateVendorDto {
  @ApiPropertyOptional({ description: 'Vendor name' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  vendorName?: string;

  @ApiPropertyOptional({ description: 'Vendor type', enum: VendorType })
  @IsOptional()
  @IsEnum(VendorType)
  vendorType?: VendorType;

  @ApiPropertyOptional({ description: 'Billing address', type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @ApiPropertyOptional({ description: 'Service address', type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  serviceAddress?: AddressDto;

  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Tax ID or EIN' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  taxId?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Update Vendor Status DTO
export class UpdateVendorStatusDto {
  @ApiProperty({ description: 'New vendor status', enum: VendorStatus })
  @IsEnum(VendorStatus)
  status!: VendorStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Update Vendor Performance DTO
export class UpdateVendorPerformanceDto {
  @ApiProperty({
    description: 'Overall performance rating',
    enum: VendorRating,
  })
  @IsEnum(VendorRating)
  overallRating!: VendorRating;

  @ApiProperty({ description: 'Safety performance rating', enum: VendorRating })
  @IsEnum(VendorRating)
  safetyRating!: VendorRating;

  @ApiProperty({
    description: 'Quality performance rating',
    enum: VendorRating,
  })
  @IsEnum(VendorRating)
  qualityRating!: VendorRating;

  @ApiProperty({
    description: 'Timeliness performance rating',
    enum: VendorRating,
  })
  @IsEnum(VendorRating)
  timelinessRating!: VendorRating;

  @ApiProperty({ description: 'Cost effectiveness rating', enum: VendorRating })
  @IsEnum(VendorRating)
  costEffectivenessRating!: VendorRating;

  @ApiPropertyOptional({ description: 'Evaluation notes' })
  @IsOptional()
  @IsString()
  evaluationNotes?: string;
}

// Vendor Response DTO
export class VendorResponseDto {
  @ApiProperty({ description: 'Vendor ID' })
  id!: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId!: string;

  @ApiProperty({ description: 'Vendor name' })
  vendorName!: string;

  @ApiProperty({ description: 'Vendor code' })
  vendorCode!: string;

  @ApiProperty({ description: 'Vendor type', enum: VendorType })
  vendorType!: VendorType;

  @ApiProperty({ description: 'Vendor status', enum: VendorStatus })
  status!: VendorStatus;

  @ApiPropertyOptional({ description: 'Tax ID' })
  taxId?: string;

  @ApiProperty({ description: 'Billing address', type: AddressDto })
  billingAddress!: AddressDto;

  @ApiPropertyOptional({ description: 'Service address', type: AddressDto })
  serviceAddress?: AddressDto;

  @ApiProperty({ description: 'Payment terms' })
  paymentTerms!: string;

  @ApiPropertyOptional({
    description: 'Insurance information',
    type: InsuranceDto,
  })
  insurance?: InsuranceDto;

  @ApiProperty({ description: 'Certifications', type: [CertificationDto] })
  certifications!: CertificationDto[];

  @ApiProperty({ description: 'Is prequalified' })
  isPrequalified!: boolean;

  @ApiPropertyOptional({ description: 'Prequalification date' })
  prequalificationDate?: string;

  @ApiProperty({
    description: 'Overall performance rating',
    enum: VendorRating,
  })
  overallRating!: VendorRating;

  @ApiProperty({ description: 'Safety rating', enum: VendorRating })
  safetyRating!: VendorRating;

  @ApiProperty({ description: 'Quality rating', enum: VendorRating })
  qualityRating!: VendorRating;

  @ApiProperty({ description: 'Timeliness rating', enum: VendorRating })
  timelinessRating!: VendorRating;

  @ApiProperty({ description: 'Cost effectiveness rating', enum: VendorRating })
  costEffectivenessRating!: VendorRating;

  @ApiProperty({ description: 'Total jobs completed' })
  totalJobsCompleted!: number;

  @ApiProperty({ description: 'Average job value' })
  averageJobValue!: number;

  @ApiProperty({ description: 'Incident count' })
  incidentCount!: number;

  @ApiPropertyOptional({ description: 'Last evaluation date' })
  lastEvaluationDate?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  website?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiProperty({ description: 'Is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Created date' })
  createdAt!: string;

  @ApiProperty({ description: 'Updated date' })
  updatedAt!: string;
}
