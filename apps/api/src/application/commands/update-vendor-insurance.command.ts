import { ICommand } from '@nestjs/cqrs';

export interface InsurancePolicy {
  carrier: string;
  policyNumber: string;
  coverageAmount: number;
  expirationDate: Date;
}

export interface UpdateVendorInsuranceData {
  generalLiability: InsurancePolicy;
  workersCompensation?: InsurancePolicy;
  autoLiability?: InsurancePolicy;
  professionalLiability?: InsurancePolicy;
  environmentalLiability?: InsurancePolicy;
  umbrella?: InsurancePolicy;
}

/**
 * Update Vendor Insurance Command
 * Command to update a vendor's insurance information
 */
export class UpdateVendorInsuranceCommand implements ICommand {
  constructor(
    public readonly vendorId: string,
    public readonly insurance: UpdateVendorInsuranceData,
    public readonly updatedBy?: string,
  ) {}
}
