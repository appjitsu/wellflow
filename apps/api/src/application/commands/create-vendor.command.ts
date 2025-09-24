import { ICommand } from '@nestjs/cqrs';
import { VendorType } from '../../domain/enums/vendor-status.enum';

export interface CreateVendorAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Create Vendor Command
 * Command to create a new vendor in the system
 */
export class CreateVendorCommand implements ICommand {
  constructor(
    public readonly organizationId: string,
    public readonly vendorName: string,
    public readonly vendorCode: string,
    public readonly vendorType: VendorType,
    public readonly billingAddress: CreateVendorAddress,
    public readonly paymentTerms: string,
    public readonly taxId?: string,
    public readonly serviceAddress?: CreateVendorAddress,
    public readonly website?: string,
    public readonly notes?: string,
    public readonly createdBy?: string,
  ) {}
}
