import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateCashCallDto {
  @IsNotEmpty() organizationId!: string;
  @IsNotEmpty() leaseId!: string;
  @IsNotEmpty() partnerId!: string;
  @IsDateString() billingMonth!: string; // YYYY-MM-DD
  @Matches(/^-?\d+\.\d{2}$/) amount!: string;
  @IsEnum(['MONTHLY', 'SUPPLEMENTAL'] as const) type!:
    | 'MONTHLY'
    | 'SUPPLEMENTAL';
  @IsOptional() @IsDateString() dueDate?: string | null;
  @IsOptional() @Matches(/^\d+\.\d{2}$/) interestRatePercent?: string | null;
  @IsOptional() @IsBoolean() consentRequired?: boolean;
}
