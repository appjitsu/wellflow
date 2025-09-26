import { IsDateString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateJoaDto {
  @IsNotEmpty() organizationId!: string;
  @IsNotEmpty() agreementNumber!: string;
  @IsDateString() effectiveDate!: string;
  @IsOptional() @IsDateString() endDate?: string | null;
  @IsOptional() @Matches(/^\d+\.\d{2}$/) operatorOverheadPercent?:
    | string
    | null;
  @IsOptional() @Matches(/^\d+\.\d{2}$/) votingThresholdPercent?: string | null;
  @IsOptional() @Matches(/^\d+\.\d{2}$/) nonConsentPenaltyPercent?:
    | string
    | null;
  @IsOptional() terms?: Record<string, unknown> | null;
}
