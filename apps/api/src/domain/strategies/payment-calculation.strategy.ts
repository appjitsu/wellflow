/**
 * Payment Calculation Strategy Pattern
 * Implements different calculation methods for various payment types in oil & gas operations
 */

export interface PaymentAmount {
  amount: number;
  currency: string;
  calculationType: string;
  breakdown?: Record<string, unknown>;
}

export interface ProductionData {
  oilVolume?: number; // barrels
  gasVolume?: number; // MCF (thousand cubic feet)
  waterVolume?: number; // barrels
  oilPrice?: number; // per barrel
  gasPrice?: number; // per MCF
  productionDate: Date;
}

export interface LeaseData {
  id: string;
  royaltyRate: number; // decimal (e.g., 0.125 for 12.5%)
  workingInterest: number; // decimal (e.g., 0.75 for 75%)
  netRevenueInterest: number; // decimal
  operatingExpenses?: number;
  acreage: number;
  leaseBonus?: number;
}

/**
 * Base strategy interface for payment calculations
 */
export interface PaymentCalculationStrategy {
  calculate(lease: LeaseData, production: ProductionData): PaymentAmount;
  getCalculationType(): string;
  isApplicable(lease: LeaseData, production: ProductionData): boolean;
}

/**
 * Royalty Payment Strategy
 * Calculates payments based on royalty interest
 */
export class RoyaltyPaymentStrategy implements PaymentCalculationStrategy {
  calculate(lease: LeaseData, production: ProductionData): PaymentAmount {
    const oilRevenue = (production.oilVolume || 0) * (production.oilPrice || 0);
    const gasRevenue = (production.gasVolume || 0) * (production.gasPrice || 0);
    const totalRevenue = oilRevenue + gasRevenue;

    const royaltyAmount = totalRevenue * lease.royaltyRate;

    return {
      amount: royaltyAmount,
      currency: 'USD',
      calculationType: this.getCalculationType(),
      breakdown: {
        oilRevenue,
        gasRevenue,
        totalRevenue,
        royaltyRate: lease.royaltyRate,
        royaltyAmount,
      },
    };
  }

  getCalculationType(): string {
    return 'ROYALTY_PAYMENT';
  }

  isApplicable(lease: LeaseData, production: ProductionData): boolean {
    return (
      lease.royaltyRate > 0 &&
      Boolean(
        (production.oilVolume && production.oilVolume > 0) ||
          (production.gasVolume && production.gasVolume > 0),
      )
    );
  }
}

/**
 * Working Interest Strategy
 * Calculates net revenue after operating expenses
 */
export class WorkingInterestStrategy implements PaymentCalculationStrategy {
  calculate(lease: LeaseData, production: ProductionData): PaymentAmount {
    const oilRevenue = (production.oilVolume || 0) * (production.oilPrice || 0);
    const gasRevenue = (production.gasVolume || 0) * (production.gasPrice || 0);
    const grossRevenue = oilRevenue + gasRevenue;

    const operatingExpenses = lease.operatingExpenses || 0;
    const netRevenue = Math.max(0, grossRevenue - operatingExpenses);
    const workingInterestAmount = netRevenue * lease.workingInterest;

    return {
      amount: workingInterestAmount,
      currency: 'USD',
      calculationType: this.getCalculationType(),
      breakdown: {
        oilRevenue,
        gasRevenue,
        grossRevenue,
        operatingExpenses,
        netRevenue,
        workingInterest: lease.workingInterest,
        workingInterestAmount,
      },
    };
  }

  getCalculationType(): string {
    return 'WORKING_INTEREST';
  }

  isApplicable(lease: LeaseData, _production: ProductionData): boolean {
    return lease.workingInterest > 0;
  }
}

/**
 * Net Revenue Interest Strategy
 * Calculates based on net revenue interest without operating expenses
 */
export class NetRevenueInterestStrategy implements PaymentCalculationStrategy {
  calculate(lease: LeaseData, production: ProductionData): PaymentAmount {
    const oilRevenue = (production.oilVolume || 0) * (production.oilPrice || 0);
    const gasRevenue = (production.gasVolume || 0) * (production.gasPrice || 0);
    const totalRevenue = oilRevenue + gasRevenue;

    const nriAmount = totalRevenue * lease.netRevenueInterest;

    return {
      amount: nriAmount,
      currency: 'USD',
      calculationType: this.getCalculationType(),
      breakdown: {
        oilRevenue,
        gasRevenue,
        totalRevenue,
        netRevenueInterest: lease.netRevenueInterest,
        nriAmount,
      },
    };
  }

  getCalculationType(): string {
    return 'NET_REVENUE_INTEREST';
  }

  isApplicable(lease: LeaseData, _production: ProductionData): boolean {
    return lease.netRevenueInterest > 0;
  }
}

/**
 * Lease Bonus Strategy
 * Calculates one-time lease bonus payments
 */
export class LeaseBonusStrategy implements PaymentCalculationStrategy {
  calculate(lease: LeaseData, _production: ProductionData): PaymentAmount {
    const bonusAmount = (lease.leaseBonus || 0) * lease.acreage;

    return {
      amount: bonusAmount,
      currency: 'USD',
      calculationType: this.getCalculationType(),
      breakdown: {
        leaseBonus: lease.leaseBonus || 0,
        acreage: lease.acreage,
        bonusAmount,
      },
    };
  }

  getCalculationType(): string {
    return 'LEASE_BONUS';
  }

  isApplicable(lease: LeaseData, _production: ProductionData): boolean {
    return (lease.leaseBonus || 0) > 0;
  }
}

/**
 * Composite Payment Strategy
 * Combines multiple payment calculations
 */
export class CompositePaymentStrategy implements PaymentCalculationStrategy {
  constructor(private readonly strategies: PaymentCalculationStrategy[]) {}

  calculate(lease: LeaseData, production: ProductionData): PaymentAmount {
    const results: PaymentAmount[] = [];
    let totalAmount = 0;
    const compositeBreakdown: Record<string, PaymentAmount> = {};

    for (const strategy of this.strategies) {
      if (strategy.isApplicable(lease, production)) {
        const result = strategy.calculate(lease, production);
        results.push(result);
        totalAmount += result.amount;
        compositeBreakdown[strategy.getCalculationType()] = result;
      }
    }

    return {
      amount: totalAmount,
      currency: 'USD',
      calculationType: this.getCalculationType(),
      breakdown: {
        totalAmount,
        calculations: compositeBreakdown,
        strategyCount: results.length,
      },
    };
  }

  getCalculationType(): string {
    return 'COMPOSITE_PAYMENT';
  }

  isApplicable(lease: LeaseData, production: ProductionData): boolean {
    return this.strategies.some((strategy) =>
      strategy.isApplicable(lease, production),
    );
  }
}

/**
 * Payment Strategy Factory
 * Creates appropriate payment calculation strategy based on context
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class PaymentStrategyFactory {
  private static readonly strategies = new Map<
    string,
    () => PaymentCalculationStrategy
  >([
    ['ROYALTY', () => new RoyaltyPaymentStrategy()],
    ['WORKING_INTEREST', () => new WorkingInterestStrategy()],
    ['NET_REVENUE_INTEREST', () => new NetRevenueInterestStrategy()],
    ['LEASE_BONUS', () => new LeaseBonusStrategy()],
  ]);

  static createStrategy(type: string): PaymentCalculationStrategy {
    const strategyFactory = this.strategies.get(type.toUpperCase());
    if (!strategyFactory) {
      throw new Error(`Unknown payment calculation strategy: ${type}`);
    }
    return strategyFactory();
  }

  static createCompositeStrategy(types: string[]): CompositePaymentStrategy {
    const strategies = types.map((type) => this.createStrategy(type));
    return new CompositePaymentStrategy(strategies);
  }

  static getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  static createDefaultStrategy(lease: LeaseData): PaymentCalculationStrategy {
    const strategies: PaymentCalculationStrategy[] = [];

    if (lease.royaltyRate > 0) {
      strategies.push(new RoyaltyPaymentStrategy());
    }

    if (lease.workingInterest > 0) {
      strategies.push(new WorkingInterestStrategy());
    }

    if (lease.netRevenueInterest > 0) {
      strategies.push(new NetRevenueInterestStrategy());
    }

    if ((lease.leaseBonus || 0) > 0) {
      strategies.push(new LeaseBonusStrategy());
    }

    if (strategies.length === 0) {
      // Default to royalty if no specific strategy applies
      strategies.push(new RoyaltyPaymentStrategy());
    }

    return strategies.length === 1
      ? (strategies[0] as PaymentCalculationStrategy)
      : new CompositePaymentStrategy(strategies);
  }
}
