import { eq, inArray, and, or, gte, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { wells } from '../../database/schemas/wells';
import { Well } from '../entities/well.entity';
import { WellStatus, WellType } from '../enums/well-status.enum';
import { ApiNumber } from '../value-objects/api-number';
import {
  CompositeSpecification,
  SpecificationMetadata,
} from './specification.interface';

/**
 * Specification for active wells (producing or drilling)
 */
export class ActiveWellsSpecification extends CompositeSpecification<Well> {
  async isSatisfiedBy(well: Well): Promise<boolean> {
    const activeStatuses = [WellStatus.PRODUCING, WellStatus.DRILLING];
    return Promise.resolve(activeStatuses.includes(well.getStatus()));
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'ActiveWells',
      description: 'Specification for active wells (producing or drilling)',
      priority: 1,
      category: 'status',
      tags: ['wells', 'active', 'status'],
    };
  }

  toSqlClause(): SQL<unknown> {
    return inArray(wells.status, ['active', 'drilling']);
  }
}

/**
 * Specification for wells by status
 */
export class WellsByStatusSpecification extends CompositeSpecification<Well> {
  constructor(private readonly status: WellStatus) {
    super();
  }

  async isSatisfiedBy(well: Well): Promise<boolean> {
    return Promise.resolve(well.getStatus() === this.status);
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'WellsByStatus',
      description: `Specification for wells with status: ${this.status}`,
      priority: 1,
      category: 'status',
      tags: ['wells', 'status', this.status.toLowerCase()],
    };
  }

  toSqlClause(): SQL<unknown> {
    return eq(
      wells.status,
      this.status as unknown as 'active' | 'inactive' | 'plugged' | 'drilling',
    );
  }
}

/**
 * Specification for wells by type
 */
export class WellsByTypeSpecification extends CompositeSpecification<Well> {
  constructor(private readonly wellType: WellType) {
    super();
  }

  async isSatisfiedBy(well: Well): Promise<boolean> {
    return Promise.resolve(well.getWellType() === this.wellType);
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'WellsByType',
      description: `Specification for wells of type: ${this.wellType}`,
      priority: 1,
      category: 'type',
      tags: ['wells', 'type', this.wellType.toLowerCase()],
    };
  }

  toSqlClause(): SQL<unknown> {
    return eq(wells.wellType, this.wellType);
  }
}

/**
 * Specification for wells by operator
 */
export class WellsByOperatorSpecification extends CompositeSpecification<Well> {
  constructor(private readonly operatorId: string) {
    super();
  }

  async isSatisfiedBy(well: Well): Promise<boolean> {
    return Promise.resolve(well.getOperatorId() === this.operatorId);
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'WellsByOperator',
      description: `Specification for wells by operator: ${this.operatorId}`,
      priority: 1,
      category: 'operator',
      tags: ['wells', 'operator'],
    };
  }

  toSqlClause(): SQL<unknown> {
    return eq(wells.operator, this.operatorId);
  }
}

/**
 * Specification for wells with unique API number (for duplicate checking)
 */
export class DuplicateApiNumberSpecification extends CompositeSpecification<Well> {
  constructor(private readonly apiNumber: ApiNumber) {
    super();
  }

  async isSatisfiedBy(well: Well): Promise<boolean> {
    return Promise.resolve(
      well.getApiNumber().getValue() === this.apiNumber.getValue(),
    );
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'DuplicateApiNumber',
      description: `Specification for wells with duplicate API number: ${this.apiNumber.getValue()}`,
      priority: 2,
      category: 'validation',
      tags: ['wells', 'api-number', 'duplicate'],
    };
  }

  toSqlClause(): SQL<unknown> {
    return eq(wells.apiNumber, this.apiNumber.getValue());
  }
}

/**
 * Specification for wells by depth range
 */
export class WellsByDepthRangeSpecification extends CompositeSpecification<Well> {
  constructor(
    private readonly minDepth: number,
    private readonly maxDepth: number,
  ) {
    super();
  }

  async isSatisfiedBy(well: Well): Promise<boolean> {
    const totalDepth = well.getTotalDepth();
    if (!totalDepth) return Promise.resolve(false);

    return Promise.resolve(
      totalDepth >= this.minDepth && totalDepth <= this.maxDepth,
    );
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'WellsByDepthRange',
      description: `Specification for wells with depth between ${this.minDepth} and ${this.maxDepth} feet`,
      priority: 1,
      category: 'depth',
      tags: ['wells', 'depth', 'range'],
    };
  }

  toSqlClause(): SQL<unknown> {
    return and(
      gte(wells.totalDepth, this.minDepth.toString()),
      lte(wells.totalDepth, this.maxDepth.toString()),
    ) as SQL<unknown>;
  }
}

/**
 * Specification for wells by lease
 */
export class WellsByLeaseSpecification extends CompositeSpecification<Well> {
  constructor(private readonly leaseId: string) {
    super();
  }

  async isSatisfiedBy(well: Well): Promise<boolean> {
    return Promise.resolve(well.getLeaseId() === this.leaseId);
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'WellsByLease',
      description: `Specification for wells by lease: ${this.leaseId}`,
      priority: 1,
      category: 'lease',
      tags: ['wells', 'lease'],
    };
  }

  toSqlClause(): SQL<unknown> {
    return eq(wells.leaseId, this.leaseId);
  }
}

/**
 * Specification for productive wells (producing status)
 */
export class ProductiveWellsSpecification extends CompositeSpecification<Well> {
  async isSatisfiedBy(well: Well): Promise<boolean> {
    return Promise.resolve(well.getStatus() === WellStatus.PRODUCING);
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'ProductiveWells',
      description: 'Specification for productive wells (producing status)',
      priority: 1,
      category: 'status',
      tags: ['wells', 'productive', 'producing'],
    };
  }

  toSqlClause(): SQL<unknown> {
    return eq(wells.status, 'active');
  }
}

/**
 * Specification for wells that need attention (temporarily abandoned, shut in)
 */
export class WellsNeedingAttentionSpecification extends CompositeSpecification<Well> {
  async isSatisfiedBy(well: Well): Promise<boolean> {
    const attentionStatuses = [
      WellStatus.TEMPORARILY_ABANDONED,
      WellStatus.SHUT_IN,
    ];
    return Promise.resolve(attentionStatuses.includes(well.getStatus()));
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'WellsNeedingAttention',
      description:
        'Specification for wells that need attention (temporarily abandoned, shut in)',
      priority: 2,
      category: 'status',
      tags: ['wells', 'attention', 'maintenance'],
    };
  }

  toSqlClause(): SQL<unknown> {
    return inArray(wells.status, ['inactive', 'plugged']);
  }
}

/**
 * Complex specification example: High-priority wells
 * Wells that are either producing OR (drilling and deep)
 */
export class HighPriorityWellsSpecification extends CompositeSpecification<Well> {
  private readonly minDeepWellDepth = 10000; // 10,000 feet

  async isSatisfiedBy(well: Well): Promise<boolean> {
    const isProducing = well.getStatus() === WellStatus.PRODUCING;
    const isDrillingAndDeep =
      well.getStatus() === WellStatus.DRILLING &&
      (well.getTotalDepth() || 0) >= this.minDeepWellDepth;

    return Promise.resolve(isProducing || isDrillingAndDeep);
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'HighPriorityWells',
      description:
        'Specification for high-priority wells (producing or deep drilling)',
      priority: 3,
      category: 'priority',
      tags: ['wells', 'high-priority', 'producing', 'deep'],
    };
  }

  toSqlClause(): SQL<unknown> {
    const producing = eq(wells.status, 'active');
    const deepDrilling = and(
      eq(wells.status, 'drilling'),
      gte(wells.totalDepth, this.minDeepWellDepth.toString()),
    );

    return or(producing, deepDrilling) as SQL<unknown>;
  }
}
