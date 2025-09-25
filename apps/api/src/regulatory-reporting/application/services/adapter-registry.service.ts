import { Injectable } from '@nestjs/common';
import { RegulatoryReportInstance } from '../../domain/entities/regulatory-report-instance.entity';
import { RegulatorAdapter } from '../../infrastructure/adapters/regulator-adapter.interface';
import { TxRrcPrAdapter } from '../../infrastructure/adapters/tx-rrc-pr.adapter';

@Injectable()
export class AdapterRegistryService {
  constructor(private readonly txAdapter: TxRrcPrAdapter) {}

  resolve(instance: RegulatoryReportInstance): RegulatorAdapter {
    if (
      instance.getJurisdiction() === 'TX' &&
      instance.getReportType() === 'PR'
    ) {
      return this.txAdapter;
    }
    throw new Error('Unsupported jurisdiction/reportType');
  }
}
