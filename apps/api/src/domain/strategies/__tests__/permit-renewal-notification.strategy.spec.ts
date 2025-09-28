import { NinetyDayRenewalStrategy } from '../permit-renewal-notification.strategy';

describe('NinetyDayRenewalStrategy', () => {
  it('should be defined', () => {
    const strategy = new NinetyDayRenewalStrategy();
    expect(strategy).toBeDefined();
  });
});
