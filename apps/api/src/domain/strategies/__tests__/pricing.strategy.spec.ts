import { StandardMarketPricingStrategy } from '../pricing.strategy';

describe('StandardMarketPricingStrategy', () => {
  it('should be defined', () => {
    const strategy = new StandardMarketPricingStrategy();
    expect(strategy).toBeDefined();
  });
});
