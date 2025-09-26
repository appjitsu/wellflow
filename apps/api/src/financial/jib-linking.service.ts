import { Injectable } from '@nestjs/common';
import { CashCall } from '../domain/entities/cash-call.entity';
import { JibStatement } from '../domain/entities/jib-statement.entity';

@Injectable()
export class JibLinkingService {
  // Policy: match by same lease, partner, org (checked outside), and billingMonth month === statementPeriodEnd month
  selectCashCallForJib(
    jib: JibStatement,
    candidates: CashCall[],
  ): CashCall | null {
    const end = new Date(jib.getStatementPeriodEnd() + 'T00:00:00Z');
    const targetMonth = end.getUTCMonth();
    const targetYear = end.getUTCFullYear();
    const match = candidates.find((cc) => {
      const data = cc.toPersistence();
      const d = new Date(data.billingMonth + 'T00:00:00Z');
      return (
        data.leaseId === jib.getLeaseId() &&
        data.partnerId === jib.getPartnerId() &&
        d.getUTCMonth() === targetMonth &&
        d.getUTCFullYear() === targetYear
      );
    });
    return match ?? null;
  }
}
