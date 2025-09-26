import {
  CompositeSpecification,
  SpecificationMetadata,
} from '../specification.interface';
import { Permit } from '../../entities/permit.entity';

/**
 * Specification for permits that are expiring within a certain number of days
 * Implements the Specification pattern for reusable business rules
 */
export class ExpiringPermitSpecification extends CompositeSpecification<Permit> {
  constructor(private readonly daysFromNow: number) {
    super();
  }

  async isSatisfiedBy(permit: Permit): Promise<boolean> {
    return Promise.resolve(permit.isExpiringSoon(this.daysFromNow));
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'ExpiringPermit',
      description: `Specification for permits expiring within ${this.daysFromNow} days`,
      priority: 2,
      category: 'permit-expiry',
      tags: ['permits', 'expiry', 'deadline'],
    };
  }
}

/**
 * Specification for active permits
 */
export class ActivePermitSpecification extends CompositeSpecification<Permit> {
  async isSatisfiedBy(permit: Permit): Promise<boolean> {
    return Promise.resolve(permit.isActive());
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'ActivePermit',
      description: 'Specification for active permits',
      priority: 1,
      category: 'permit-status',
      tags: ['permits', 'active', 'status'],
    };
  }
}

/**
 * Specification for permits requiring renewal
 */
export class RenewalRequiredSpecification extends CompositeSpecification<Permit> {
  async isSatisfiedBy(permit: Permit): Promise<boolean> {
    return Promise.resolve(permit.requiresRenewal());
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'RenewalRequired',
      description: 'Specification for permits requiring renewal',
      priority: 2,
      category: 'permit-renewal',
      tags: ['permits', 'renewal', 'required'],
    };
  }
}
