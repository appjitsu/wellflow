import { ICommand } from '@nestjs/cqrs';

/**
 * Add Vendor Certification Command
 * Command to add a certification to a vendor
 */
export class AddVendorCertificationCommand implements ICommand {
  constructor(
    public readonly vendorId: string,
    public readonly certificationName: string,
    public readonly issuingBody: string,
    public readonly certificationNumber: string,
    public readonly issueDate: Date,
    public readonly expirationDate: Date,
    public readonly documentPath?: string,
    public readonly addedBy?: string,
  ) {}
}
