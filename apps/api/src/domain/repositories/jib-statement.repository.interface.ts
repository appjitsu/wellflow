import type {
  JibLineItem,
  JibStatement,
} from '../entities/jib-statement.entity';

export interface IJibStatementRepository {
  findById(id: string): Promise<JibStatement | null>;
  create(input: {
    organizationId: string;
    leaseId: string;
    partnerId: string;
    statementPeriodStart: string; // YYYY-MM-DD
    statementPeriodEnd: string; // YYYY-MM-DD
    dueDate?: string | null; // YYYY-MM-DD
    grossRevenue?: string;
    netRevenue?: string;
    workingInterestShare?: string;
    royaltyShare?: string;
    previousBalance?: string;
    currentBalance?: string;
    lineItems?: JibLineItem[] | null;
    status?: 'draft' | 'sent' | 'paid';
    sentAt?: Date;
    paidAt?: Date;
  }): Promise<JibStatement>;
  save(entity: JibStatement): Promise<JibStatement>;
}
