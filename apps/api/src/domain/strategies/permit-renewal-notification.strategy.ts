import { Permit } from '../entities/permit.entity';

type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Strategy interface for permit renewal notifications
 * Defines the contract for different notification strategies
 */
export interface PermitRenewalNotificationStrategy {
  /**
   * Determine if a permit should receive a notification
   * @param permit The permit to evaluate
   * @returns True if notification should be sent
   */
  shouldNotify(permit: Permit): boolean;

  /**
   * Get the notification message for the permit
   * @param permit The permit to notify about
   * @returns The notification message
   */
  getNotificationMessage(permit: Permit): string;

  /**
   * Get the notification priority
   * @param permit The permit to evaluate
   * @returns Priority level (low, medium, high, critical)
   */
  getNotificationPriority(permit: Permit): NotificationPriority;
}

/**
 * Strategy for permits expiring within 90 days
 */
export class NinetyDayRenewalStrategy
  implements PermitRenewalNotificationStrategy
{
  shouldNotify(permit: Permit): boolean {
    return permit.isExpiringSoon(90) && permit.isActive();
  }

  getNotificationMessage(permit: Permit): string {
    const daysUntilExpiry = permit.expirationDate
      ? Math.ceil(
          (permit.expirationDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    return `Permit ${permit.permitNumber} expires in ${daysUntilExpiry} days. Please initiate renewal process.`;
  }

  getNotificationPriority(permit: Permit): NotificationPriority {
    const daysUntilExpiry = permit.expirationDate
      ? Math.ceil(
          (permit.expirationDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    if (daysUntilExpiry <= 30) return 'critical';
    if (daysUntilExpiry <= 60) return 'high';
    return 'medium';
  }
}

/**
 * Strategy for permits expiring within 30 days
 */
export class ThirtyDayRenewalStrategy
  implements PermitRenewalNotificationStrategy
{
  shouldNotify(permit: Permit): boolean {
    return permit.isExpiringSoon(30) && permit.isActive();
  }

  getNotificationMessage(permit: Permit): string {
    const daysUntilExpiry = permit.expirationDate
      ? Math.ceil(
          (permit.expirationDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    return `URGENT: Permit ${permit.permitNumber} expires in ${daysUntilExpiry} days. Immediate renewal action required.`;
  }

  getNotificationPriority(permit: Permit): NotificationPriority {
    const daysUntilExpiry = permit.expirationDate
      ? Math.ceil(
          (permit.expirationDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    if (daysUntilExpiry <= 7) return 'critical';
    if (daysUntilExpiry <= 14) return 'high';
    return 'medium';
  }
}

/**
 * Strategy for expired permits
 */
export class ExpiredPermitStrategy
  implements PermitRenewalNotificationStrategy
{
  shouldNotify(permit: Permit): boolean {
    return permit.isExpired();
  }

  getNotificationMessage(permit: Permit): string {
    const daysSinceExpiry = permit.expirationDate
      ? Math.floor(
          (new Date().getTime() - permit.expirationDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    return `CRITICAL: Permit ${permit.permitNumber} has expired ${daysSinceExpiry} days ago. Operations may be non-compliant.`;
  }

  getNotificationPriority(_permit: Permit): NotificationPriority {
    return 'critical';
  }
}

/**
 * Context class that uses different notification strategies
 * Implements the Strategy pattern
 */
export class PermitRenewalNotificationContext {
  constructor(private strategy: PermitRenewalNotificationStrategy) {}

  setStrategy(strategy: PermitRenewalNotificationStrategy): void {
    this.strategy = strategy;
  }

  shouldNotify(permit: Permit): boolean {
    return this.strategy.shouldNotify(permit);
  }

  getNotification(permit: Permit): {
    message: string;
    priority: NotificationPriority;
  } {
    return {
      message: this.strategy.getNotificationMessage(permit),
      priority: this.strategy.getNotificationPriority(permit),
    };
  }
}

/**
 * Factory for creating notification strategies based on context
 * Implements the Factory pattern with Strategy pattern
 */
export const PermitRenewalNotificationStrategyFactory = {
  createStrategyForPermit(
    _permit: Permit,
  ): PermitRenewalNotificationStrategy[] {
    const strategies: PermitRenewalNotificationStrategy[] = [];

    // Always check for expired permits first (highest priority)
    strategies.push(new ExpiredPermitStrategy());

    // Then check for urgent renewals
    strategies.push(new ThirtyDayRenewalStrategy());

    // Finally check for general renewals
    strategies.push(new NinetyDayRenewalStrategy());

    return strategies;
  },

  createUrgentStrategy(): PermitRenewalNotificationStrategy {
    return new ThirtyDayRenewalStrategy();
  },

  createStandardStrategy(): PermitRenewalNotificationStrategy {
    return new NinetyDayRenewalStrategy();
  },

  createExpiredStrategy(): PermitRenewalNotificationStrategy {
    return new ExpiredPermitStrategy();
  },
};
