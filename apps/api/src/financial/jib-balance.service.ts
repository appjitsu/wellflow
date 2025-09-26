import { Injectable } from '@nestjs/common';

export interface JibStatementInput {
  currentBalance: string; // 12,2 as string
  dueDate?: string | null; // YYYY-MM-DD
}

export interface InterestPolicy {
  annualInterestRatePercent: string; // 5,2 e.g. '12.00'
  dayCountBasis?: 365 | 360; // default 365
}

export interface InterestResult {
  daysPastDue: number;
  interestAccrued: string; // 12,2
}

@Injectable()
export class JibBalanceService {
  calculateInterest(
    input: JibStatementInput,
    policy: InterestPolicy,
    asOf: Date = new Date(),
  ): InterestResult {
    const basis = policy.dayCountBasis ?? 365;
    const balance = this.parseAmount(input.currentBalance);
    if (balance <= 0) return { daysPastDue: 0, interestAccrued: '0.00' };
    if (!input.dueDate) return { daysPastDue: 0, interestAccrued: '0.00' };

    const due = new Date(input.dueDate + 'T00:00:00Z');
    const ms = asOf.getTime() - due.getTime();
    const days = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
    if (days === 0) return { daysPastDue: 0, interestAccrued: '0.00' };

    const annualRate = parseFloat(policy.annualInterestRatePercent) / 100.0;
    const perDayRate = annualRate / basis;
    const interest = balance * perDayRate * days;
    return { daysPastDue: days, interestAccrued: this.formatAmount(interest) };
  }

  private parseAmount(v: string): number {
    if (!/^-?\d+\.\d{2}$/.test(v))
      throw new Error('amount must be 12,2 string');
    return parseFloat(v);
  }

  private formatAmount(n: number): string {
    return n.toFixed(2);
  }
}
