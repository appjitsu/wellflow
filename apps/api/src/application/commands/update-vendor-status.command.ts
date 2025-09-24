import { ICommand } from '@nestjs/cqrs';
import { VendorStatus } from '../../domain/enums/vendor-status.enum';

/**
 * Update Vendor Status Command
 * Command to change a vendor's status (approve, reject, suspend, etc.)
 */
export class UpdateVendorStatusCommand implements ICommand {
  constructor(
    public readonly vendorId: string,
    public readonly newStatus: VendorStatus,
    public readonly reason?: string,
    public readonly updatedBy?: string,
  ) {}
}
