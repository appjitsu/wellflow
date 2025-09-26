import { JibBalanceService } from '../jib-balance.service';

describe('JibBalanceService', () => {
  it('calculates zero interest when not past due or zero balance', () => {
    const svc = new JibBalanceService();
    const res1 = svc.calculateInterest(
      { currentBalance: '0.00', dueDate: '2025-01-10' },
      { annualInterestRatePercent: '12.00' },
      new Date('2025-01-15T00:00:00Z'),
    );
    expect(res1.interestAccrued).toBe('0.00');
    const res2 = svc.calculateInterest(
      { currentBalance: '100.00', dueDate: '2025-01-20' },
      { annualInterestRatePercent: '12.00' },
      new Date('2025-01-15T00:00:00Z'),
    );
    expect(res2.interestAccrued).toBe('0.00');
  });

  it('calculates simple interest past due', () => {
    const svc = new JibBalanceService();
    // 5 days past due on 100 @12%/yr => 100 * .12/365 * 5 = 0.164... => 0.16
    const res = svc.calculateInterest(
      { currentBalance: '100.00', dueDate: '2025-01-10' },
      { annualInterestRatePercent: '12.00' },
      new Date('2025-01-15T00:00:00Z'),
    );
    expect(res.daysPastDue).toBe(5);
    expect(res.interestAccrued).toBe('0.16');
  });
});
