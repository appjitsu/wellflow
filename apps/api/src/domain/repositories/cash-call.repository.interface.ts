import { CashCall } from '../entities/cash-call.entity';

export interface ICashCallRepository {
  save(entity: CashCall): Promise<CashCall>;
  findById(id: string): Promise<CashCall | null>;
  findByOrganizationId(
    organizationId: string,
    options?: {
      leaseId?: string;
      partnerId?: string;
      status?:
        | 'DRAFT'
        | 'SENT'
        | 'APPROVED'
        | 'REJECTED'
        | 'PAID'
        | 'DEFAULTED';
      limit?: number;
      offset?: number;
    },
  ): Promise<CashCall[]>;
}
