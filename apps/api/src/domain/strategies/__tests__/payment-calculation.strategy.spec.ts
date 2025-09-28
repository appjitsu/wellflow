import {
  RoyaltyPaymentStrategy,
  LeaseData,
  ProductionData,
} from '../payment-calculation.strategy';

describe('RoyaltyPaymentStrategy', () => {
  let strategy: RoyaltyPaymentStrategy;

  beforeEach(() => {
    strategy = new RoyaltyPaymentStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should calculate royalty payment', () => {
    const lease: LeaseData = {
      id: 'lease-1',
      royaltyRate: 0.125,
      workingInterest: 0.75,
      netRevenueInterest: 0.5,
      acreage: 100,
    };

    const production: ProductionData = {
      oilVolume: 1000,
      gasVolume: 5000,
      oilPrice: 50,
      gasPrice: 3,
      productionDate: new Date(),
    };

    const result = strategy.calculate(lease, production);

    expect(result.amount).toBe(8125); // (1000*50 + 5000*3) * 0.125
    expect(result.currency).toBe('USD');
    expect(result.calculationType).toBe('ROYALTY_PAYMENT');
  });

  it('should return correct calculation type', () => {
    expect(strategy.getCalculationType()).toBe('ROYALTY_PAYMENT');
  });

  it('should check applicability', () => {
    const applicableLease: LeaseData = {
      id: 'lease-1',
      royaltyRate: 0.125,
      workingInterest: 0.75,
      netRevenueInterest: 0.5,
      acreage: 100,
    };

    const production: ProductionData = {
      oilVolume: 1000,
      productionDate: new Date(),
    };

    expect(strategy.isApplicable(applicableLease, production)).toBe(true);

    const nonApplicableLease: LeaseData = {
      id: 'lease-2',
      royaltyRate: 0,
      workingInterest: 0.75,
      netRevenueInterest: 0.5,
      acreage: 100,
    };

    expect(strategy.isApplicable(nonApplicableLease, production)).toBe(false);
  });
});
