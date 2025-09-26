/**
 * Pricing Strategy Pattern
 * Implements different pricing methods for oil & gas commodities
 */

export interface MarketData {
  oilBasePrice: number; // WTI price per barrel
  gasBasePrice: number; // Henry Hub price per MCF
  exchangeRate?: number; // if different currency
  marketDate: Date;
}

export interface QualityAdjustments {
  oilGravity?: number; // API gravity
  sulfurContent?: number; // percentage
  gasHeatContent?: number; // BTU per cubic foot
  transportationCost?: number;
  processingCost?: number;
}

export interface LocationFactors {
  regionPremium?: number; // positive or negative adjustment
  transportationDifferential?: number;
  marketAccessPenalty?: number;
}

export interface PricingResult {
  oilPrice: number;
  gasPrice: number;
  totalValue: number;
  adjustments: Record<string, number>;
  pricingMethod: string;
}

/**
 * Base pricing strategy interface
 */
export interface PricingStrategy {
  calculatePrice(
    market: MarketData,
    quality: QualityAdjustments,
    location: LocationFactors,
    volume: { oil?: number; gas?: number },
  ): PricingResult;
  getPricingMethod(): string;
}

/**
 * Standard Market Pricing Strategy
 * Uses base market prices with minimal adjustments
 */
export class StandardMarketPricingStrategy implements PricingStrategy {
  calculatePrice(
    market: MarketData,
    quality: QualityAdjustments,
    location: LocationFactors,
    volume: { oil?: number; gas?: number },
  ): PricingResult {
    const oilPrice = market.oilBasePrice + (location.regionPremium || 0);
    const gasPrice = market.gasBasePrice + (location.regionPremium || 0);

    const oilValue = (volume.oil || 0) * oilPrice;
    const gasValue = (volume.gas || 0) * gasPrice;
    const totalValue = oilValue + gasValue;

    return {
      oilPrice,
      gasPrice,
      totalValue,
      adjustments: {
        regionPremium: location.regionPremium || 0,
      },
      pricingMethod: this.getPricingMethod(),
    };
  }

  getPricingMethod(): string {
    return 'STANDARD_MARKET';
  }
}

/**
 * Quality-Adjusted Pricing Strategy
 * Adjusts prices based on oil/gas quality parameters
 */
export class QualityAdjustedPricingStrategy implements PricingStrategy {
  calculatePrice(
    market: MarketData,
    quality: QualityAdjustments,
    location: LocationFactors,
    volume: { oil?: number; gas?: number },
  ): PricingResult {
    // Oil quality adjustments
    let oilAdjustment = 0;
    if (quality.oilGravity) {
      // Higher API gravity = lighter, sweeter crude = premium
      // Standard is around 35-40 API
      const gravityAdjustment = (quality.oilGravity - 37) * 0.25; // $0.25 per degree API
      oilAdjustment += gravityAdjustment;
    }

    if (quality.sulfurContent) {
      // Lower sulfur = sweet crude = premium
      const sulfurAdjustment = quality.sulfurContent > 0.5 ? -2.0 : 1.0; // Sour vs sweet crude
      oilAdjustment += sulfurAdjustment;
    }

    // Gas quality adjustments
    let gasAdjustment = 0;
    if (quality.gasHeatContent) {
      // Higher BTU content = premium
      const standardBtu = 1030; // Standard BTU per cubic foot
      const btuAdjustment = ((quality.gasHeatContent - standardBtu) / 50) * 0.1;
      gasAdjustment += btuAdjustment;
    }

    // Apply location and transportation costs
    const transportationCost = quality.transportationCost || 0;
    const processingCost = quality.processingCost || 0;

    const adjustedOilPrice =
      market.oilBasePrice + oilAdjustment - transportationCost;
    const adjustedGasPrice =
      market.gasBasePrice + gasAdjustment - transportationCost;

    const oilValue = (volume.oil || 0) * adjustedOilPrice;
    const gasValue = (volume.gas || 0) * adjustedGasPrice;
    const totalValue = oilValue + gasValue - processingCost;

    return {
      oilPrice: adjustedOilPrice,
      gasPrice: adjustedGasPrice,
      totalValue,
      adjustments: {
        oilQualityAdjustment: oilAdjustment,
        gasQualityAdjustment: gasAdjustment,
        transportationCost: -transportationCost,
        processingCost: -processingCost,
      },
      pricingMethod: this.getPricingMethod(),
    };
  }

  getPricingMethod(): string {
    return 'QUALITY_ADJUSTED';
  }
}

/**
 * Location-Based Pricing Strategy
 * Focuses heavily on location differentials and market access
 */
export class LocationBasedPricingStrategy implements PricingStrategy {
  calculatePrice(
    market: MarketData,
    quality: QualityAdjustments,
    location: LocationFactors,
    volume: { oil?: number; gas?: number },
  ): PricingResult {
    const regionPremium = location.regionPremium || 0;
    const transportationDiff = location.transportationDifferential || 0;
    const marketAccessPenalty = location.marketAccessPenalty || 0;

    const locationAdjustment =
      regionPremium + transportationDiff - marketAccessPenalty;

    const oilPrice = market.oilBasePrice + locationAdjustment;
    const gasPrice = market.gasBasePrice + locationAdjustment;

    const oilValue = (volume.oil || 0) * oilPrice;
    const gasValue = (volume.gas || 0) * gasPrice;
    const totalValue = oilValue + gasValue;

    return {
      oilPrice,
      gasPrice,
      totalValue,
      adjustments: {
        regionPremium,
        transportationDifferential: transportationDiff,
        marketAccessPenalty: -marketAccessPenalty,
        totalLocationAdjustment: locationAdjustment,
      },
      pricingMethod: this.getPricingMethod(),
    };
  }

  getPricingMethod(): string {
    return 'LOCATION_BASED';
  }
}

/**
 * Premium Pricing Strategy
 * For high-quality, well-located resources
 */
export class PremiumPricingStrategy implements PricingStrategy {
  private readonly premiumMultiplier = 1.15; // 15% premium

  calculatePrice(
    market: MarketData,
    quality: QualityAdjustments,
    location: LocationFactors,
    volume: { oil?: number; gas?: number },
  ): PricingResult {
    const basePremium = 0.15; // 15% base premium

    // Additional premiums based on quality
    let qualityBonus = 0;
    if (quality.oilGravity && quality.oilGravity > 40) {
      qualityBonus += 0.05; // Extra 5% for light crude
    }
    if (quality.sulfurContent && quality.sulfurContent < 0.3) {
      qualityBonus += 0.05; // Extra 5% for sweet crude
    }

    const totalPremium = 1 + basePremium + qualityBonus;

    const oilPrice = market.oilBasePrice * totalPremium;
    const gasPrice = market.gasBasePrice * totalPremium;

    const oilValue = (volume.oil || 0) * oilPrice;
    const gasValue = (volume.gas || 0) * gasPrice;
    const totalValue = oilValue + gasValue;

    return {
      oilPrice,
      gasPrice,
      totalValue,
      adjustments: {
        basePremium,
        qualityBonus,
        totalPremium,
      },
      pricingMethod: this.getPricingMethod(),
    };
  }

  getPricingMethod(): string {
    return 'PREMIUM_PRICING';
  }
}

/**
 * Discounted Pricing Strategy
 * For lower-quality or poorly-located resources
 */
export class DiscountedPricingStrategy implements PricingStrategy {
  calculatePrice(
    market: MarketData,
    quality: QualityAdjustments,
    location: LocationFactors,
    volume: { oil?: number; gas?: number },
  ): PricingResult {
    let discountFactor = 1.0;

    // Quality-based discounts
    if (quality.oilGravity && quality.oilGravity < 30) {
      discountFactor -= 0.1; // 10% discount for heavy crude
    }
    if (quality.sulfurContent && quality.sulfurContent > 1.0) {
      discountFactor -= 0.05; // 5% discount for sour crude
    }

    // Location-based discounts
    if (location.marketAccessPenalty && location.marketAccessPenalty > 5) {
      discountFactor -= 0.08; // 8% discount for poor market access
    }

    // Ensure minimum discount doesn't go below 60% of market price
    discountFactor = Math.max(discountFactor, 0.6);

    const oilPrice = market.oilBasePrice * discountFactor;
    const gasPrice = market.gasBasePrice * discountFactor;

    const oilValue = (volume.oil || 0) * oilPrice;
    const gasValue = (volume.gas || 0) * gasPrice;
    const totalValue = oilValue + gasValue;

    return {
      oilPrice,
      gasPrice,
      totalValue,
      adjustments: {
        discountFactor,
        finalDiscount: 1 - discountFactor,
      },
      pricingMethod: this.getPricingMethod(),
    };
  }

  getPricingMethod(): string {
    return 'DISCOUNTED_PRICING';
  }
}

/**
 * Pricing Strategy Factory
 * Creates appropriate pricing strategy based on resource characteristics
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class PricingStrategyFactory {
  private static readonly strategies = new Map<string, () => PricingStrategy>([
    ['STANDARD', () => new StandardMarketPricingStrategy()],
    ['QUALITY_ADJUSTED', () => new QualityAdjustedPricingStrategy()],
    ['LOCATION_BASED', () => new LocationBasedPricingStrategy()],
    ['PREMIUM', () => new PremiumPricingStrategy()],
    ['DISCOUNTED', () => new DiscountedPricingStrategy()],
  ]);

  static createStrategy(type: string): PricingStrategy {
    const strategyFactory = this.strategies.get(type.toUpperCase());
    if (!strategyFactory) {
      throw new Error(`Unknown pricing strategy: ${type}`);
    }
    return strategyFactory();
  }

  static getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Automatically select the best pricing strategy based on resource characteristics
   */
  static createOptimalStrategy(
    quality: QualityAdjustments,
    location: LocationFactors,
  ): PricingStrategy {
    // High-quality, well-located resources get premium pricing
    const isHighQuality =
      (quality.oilGravity && quality.oilGravity > 38) ||
      (quality.sulfurContent && quality.sulfurContent < 0.5);

    const isWellLocated =
      location.regionPremium &&
      location.regionPremium > 0 &&
      (!location.marketAccessPenalty || location.marketAccessPenalty < 2);

    if (isHighQuality && isWellLocated) {
      return new PremiumPricingStrategy();
    }

    // Poor quality or location gets discounted pricing
    const isPoorQuality =
      (quality.oilGravity && quality.oilGravity < 32) ||
      (quality.sulfurContent && quality.sulfurContent > 1.0);

    const isPoorLocation =
      location.marketAccessPenalty && location.marketAccessPenalty > 5;

    if (isPoorQuality || isPoorLocation) {
      return new DiscountedPricingStrategy();
    }

    // Significant quality differences use quality-adjusted
    if (quality.oilGravity || quality.sulfurContent || quality.gasHeatContent) {
      return new QualityAdjustedPricingStrategy();
    }

    // Significant location factors use location-based
    if (location.regionPremium || location.transportationDifferential) {
      return new LocationBasedPricingStrategy();
    }

    // Default to standard market pricing
    return new StandardMarketPricingStrategy();
  }
}
