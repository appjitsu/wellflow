import { ICommand } from '@nestjs/cqrs';
import { VendorRating } from '../../domain/enums/vendor-status.enum';

/**
 * Update Vendor Performance Command
 * Command to update a vendor's performance ratings
 */
export class UpdateVendorPerformanceCommand implements ICommand {
  constructor(
    public readonly vendorId: string,
    public readonly overallRating: VendorRating,
    public readonly safetyRating: VendorRating,
    public readonly qualityRating: VendorRating,
    public readonly timelinessRating: VendorRating,
    public readonly costEffectivenessRating: VendorRating,
    public readonly evaluationNotes?: string,
    public readonly evaluatedBy?: string,
  ) {}
}
