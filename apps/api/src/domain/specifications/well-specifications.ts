import { eq, inArray, and, or, gte, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { wells } from '../../database/schemas/wells';
import { Well } from '../entities/well.entity';
import { WellStatus, WellType } from '../enums/well-status.enum';
import { ApiNumber } from '../value-objects/api-number';
import { Specification } from './specification.interface';

/**
 * Specification for active wells (producing or drilling)
 */
export class ActiveWellsSpecification extends Specification<Well> {
  isSatisfiedBy(well: Well): boolean {
    const activeStatuses = [WellStatus.PRODUCING, WellStatus.DRILLING];
    return activeStatuses.includes(well.getStatus());
  }

  toSqlClause(): SQL<unknown> {
    return inArray(wells.status, ['active', 'drilling']);
  }
}

/**
 * Specification for wells by status
 */
export class WellsByStatusSpecification extends Specification<Well> {
  constructor(private readonly status: WellStatus) {
    super();
  }

  isSatisfiedBy(well: Well): boolean {
    return well.getStatus() === this.status;
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
export class WellsByTypeSpecification extends Specification<Well> {
  constructor(private readonly wellType: WellType) {
    super();
  }

  isSatisfiedBy(well: Well): boolean {
    return well.getWellType() === this.wellType;
  }

  toSqlClause(): SQL<unknown> {
    return eq(wells.wellType, this.wellType);
  }
}

/**
 * Specification for wells by operator
 */
export class WellsByOperatorSpecification extends Specification<Well> {
  constructor(private readonly operatorId: string) {
    super();
  }

  isSatisfiedBy(well: Well): boolean {
    return well.getOperatorId() === this.operatorId;
  }

  toSqlClause(): SQL<unknown> {
    return eq(wells.operator, this.operatorId);
  }
}

/**
 * Specification for wells with unique API number (for duplicate checking)
 */
export class DuplicateApiNumberSpecification extends Specification<Well> {
  constructor(private readonly apiNumber: ApiNumber) {
    super();
  }

  isSatisfiedBy(well: Well): boolean {
    return well.getApiNumber().getValue() === this.apiNumber.getValue();
  }

  toSqlClause(): SQL<unknown> {
    return eq(wells.apiNumber, this.apiNumber.getValue());
  }
}

/**
 * Specification for wells by depth range
 */
export class WellsByDepthRangeSpecification extends Specification<Well> {
  constructor(
    private readonly minDepth: number,
    private readonly maxDepth: number,
  ) {
    super();
  }

  isSatisfiedBy(well: Well): boolean {
    const totalDepth = well.getTotalDepth();
    if (!totalDepth) return false;

    return totalDepth >= this.minDepth && totalDepth <= this.maxDepth;
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
export class WellsByLeaseSpecification extends Specification<Well> {
  constructor(private readonly leaseId: string) {
    super();
  }

  isSatisfiedBy(well: Well): boolean {
    return well.getLeaseId() === this.leaseId;
  }

  toSqlClause(): SQL<unknown> {
    return eq(wells.leaseId, this.leaseId);
  }
}

/**
 * Specification for productive wells (producing status)
 */
export class ProductiveWellsSpecification extends Specification<Well> {
  isSatisfiedBy(well: Well): boolean {
    return well.getStatus() === WellStatus.PRODUCING;
  }

  toSqlClause(): SQL<unknown> {
    return eq(wells.status, 'active');
  }
}

/**
 * Specification for wells that need attention (temporarily abandoned, shut in)
 */
export class WellsNeedingAttentionSpecification extends Specification<Well> {
  isSatisfiedBy(well: Well): boolean {
    const attentionStatuses = [
      WellStatus.TEMPORARILY_ABANDONED,
      WellStatus.SHUT_IN,
    ];
    return attentionStatuses.includes(well.getStatus());
  }

  toSqlClause(): SQL<unknown> {
    return inArray(wells.status, ['inactive', 'plugged']);
  }
}

/**
 * Complex specification example: High-priority wells
 * Wells that are either producing OR (drilling and deep)
 */
export class HighPriorityWellsSpecification extends Specification<Well> {
  private readonly minDeepWellDepth = 10000; // 10,000 feet

  isSatisfiedBy(well: Well): boolean {
    const isProducing = well.getStatus() === WellStatus.PRODUCING;
    const isDrillingAndDeep =
      well.getStatus() === WellStatus.DRILLING &&
      (well.getTotalDepth() || 0) >= this.minDeepWellDepth;

    return isProducing || isDrillingAndDeep;
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
