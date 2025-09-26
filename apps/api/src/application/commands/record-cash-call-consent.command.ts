import type { CashCallConsentStatus } from '../../domain/entities/cash-call.entity';

export class RecordCashCallConsentCommand {
  constructor(
    public readonly organizationId: string,
    public readonly id: string,
    public readonly status: Extract<
      CashCallConsentStatus,
      'RECEIVED' | 'WAIVED'
    >,
    public readonly receivedAt?: string | null, // YYYY-MM-DD
  ) {}
}
