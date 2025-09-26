import { OwnerPayment } from '../entities/owner-payment.entity';

export interface IOwnerPaymentRepository {
  save(entity: OwnerPayment): Promise<OwnerPayment>;
  findById(id: string): Promise<OwnerPayment | null>;
  findByOrganizationId(
    organizationId: string,
    options?: {
      partnerId?: string;
      status?:
        | 'PENDING'
        | 'PROCESSED'
        | 'CLEARED'
        | 'VOID'
        | 'REVERSED'
        | 'FAILED';
      limit?: number;
      offset?: number;
    },
  ): Promise<OwnerPayment[]>;
}
