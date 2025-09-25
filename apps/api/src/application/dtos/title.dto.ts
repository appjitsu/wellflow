import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsDateString,
  IsOptional,
  Length,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TitleStatusDto {
  CLEAR = 'clear',
  DEFECTIVE = 'defective',
  PENDING = 'pending',
}

export enum CurativePriorityDto {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum CurativeStatusDto {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  WAIVED = 'waived',
}

export class CreateTitleOpinionDto {
  @ApiProperty({ description: 'Lease ID this title opinion applies to' })
  @IsUUID()
  leaseId!: string;

  @ApiProperty({
    description: 'Opinion reference/number',
    example: 'TO-2025-001',
  })
  @IsString()
  @Length(1, 50)
  opinionNumber!: string;

  @ApiProperty({ description: 'Examiner name' })
  @IsString()
  @Length(1, 255)
  examinerName!: string;

  @ApiProperty({ description: 'Examination date (YYYY-MM-DD)' })
  @IsDateString()
  examinationDate!: string;

  @ApiProperty({ description: 'Effective date (YYYY-MM-DD)' })
  @IsDateString()
  effectiveDate!: string;

  @ApiProperty({ description: 'Overall title status', enum: TitleStatusDto })
  @IsEnum(TitleStatusDto)
  titleStatus!: TitleStatusDto;

  @ApiPropertyOptional({ description: 'Findings summary' })
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional({ description: 'Recommendations summary' })
  @IsOptional()
  @IsString()
  recommendations?: string;
}

export class CreateCurativeItemDto {
  @ApiProperty({ description: 'Title opinion ID' })
  @IsUUID()
  titleOpinionId!: string;

  @ApiProperty({
    description: 'Item number within the title opinion',
    example: '1',
  })
  @IsString()
  @Length(1, 20)
  itemNumber!: string;

  @ApiProperty({
    description: 'Defect type (e.g., missing_deed|gap_in_chain|probate|other)',
  })
  @IsString()
  @Length(1, 50)
  defectType!: string;

  @ApiProperty({ description: 'Curative description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Priority (high|medium|low)' })
  @IsEnum(CurativePriorityDto)
  priority!: CurativePriorityDto;
}

export class UpdateCurativeItemStatusDto {
  @ApiProperty({ description: 'New status (open|in_progress|resolved|waived)' })
  @IsEnum(CurativeStatusDto)
  status!: CurativeStatusDto;

  @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'User who updated the status' })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class ReassignCurativeItemDto {
  @ApiProperty({ description: 'User ID to assign the item to' })
  @IsString()
  assignedTo!: string;

  @ApiPropertyOptional({ description: 'User who reassigned the item' })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class SetCurativeItemDueDateDto {
  @ApiPropertyOptional({ description: 'Due date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'User who set the due date' })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class UpdateTitleOpinionStatusDto {
  @ApiProperty({ description: 'New status (clear|defective|pending)' })
  @IsEnum(TitleStatusDto)
  status!: TitleStatusDto;

  @ApiPropertyOptional({ description: 'User who updated the status' })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class UpdateTitleOpinionFindingsDto {
  @ApiPropertyOptional({ description: 'Findings summary' })
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional({ description: 'Recommendations summary' })
  @IsOptional()
  @IsString()
  recommendations?: string;
}

export class RecordingInfoDto {
  @ApiPropertyOptional({ description: 'County where recorded' })
  @IsOptional()
  @IsString()
  county?: string;

  @ApiPropertyOptional({ description: 'State where recorded' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Volume number' })
  @IsOptional()
  @IsString()
  volume?: string;

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: 'Instrument number' })
  @IsOptional()
  @IsString()
  instrumentNumber?: string;
}

export class CreateChainOfTitleEntryDto {
  @ApiProperty({ description: 'Lease ID this entry is for' })
  @IsUUID()
  leaseId!: string;

  @ApiProperty({
    description:
      'Instrument type (deed|assignment|probate|affidavit|release|mortgage|other)',
  })
  @IsString()
  @Length(1, 50)
  instrumentType!: string;

  @ApiProperty({ description: 'Instrument date (YYYY-MM-DD)' })
  @IsDateString()
  instrumentDate!: string;

  @ApiProperty({ description: 'Grantor (seller/assignor)' })
  @IsString()
  grantor!: string;

  @ApiProperty({ description: 'Grantee (buyer/assignee)' })
  @IsString()
  grantee!: string;

  @ApiPropertyOptional({ description: 'Legal description reference' })
  @IsOptional()
  @IsString()
  legalDescriptionRef?: string;

  @ApiPropertyOptional({ description: 'Recording information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecordingInfoDto)
  recordingInfo?: RecordingInfoDto;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LinkTitleOpinionDocumentDto {
  @ApiProperty({ description: 'Title Opinion ID' })
  @IsUUID()
  titleOpinionId!: string;

  @ApiProperty({ description: 'Document ID' })
  @IsUUID()
  documentId!: string;

  @ApiProperty({
    description: 'Role (opinion|abstract|exhibit|deed|supporting)',
  })
  @IsString()
  @Length(1, 50)
  role!: string;

  @ApiPropertyOptional({ description: 'Page range, e.g., 1-12' })
  @IsOptional()
  @IsString()
  pageRange?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CurativeItemDocumentLinkDto {
  @ApiProperty({ description: 'Document link ID' })
  id!: string;

  @ApiProperty({ description: 'Curative item ID' })
  curativeItemId!: string;

  @ApiProperty({ description: 'Document ID' })
  documentId!: string;

  @ApiProperty({
    description: 'Role (resolution|evidence|supporting|reference)',
  })
  role!: string;

  @ApiPropertyOptional({ description: 'Page range, e.g., 1-12' })
  pageRange?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt!: Date;
}

export class TitleOpinionDocumentLinkDto {
  @ApiProperty({ description: 'Document link ID' })
  id!: string;

  @ApiProperty({ description: 'Title opinion ID' })
  titleOpinionId!: string;

  @ApiProperty({ description: 'Document ID' })
  documentId!: string;

  @ApiProperty({
    description: 'Role (opinion|abstract|exhibit|deed|supporting)',
  })
  role!: string;

  @ApiPropertyOptional({ description: 'Page range, e.g., 1-12' })
  pageRange?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt!: Date;
}
