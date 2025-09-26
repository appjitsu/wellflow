import { and, or, not, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

/**
 * SQL Clause interface for type-safe query building
 */
export interface SqlClause {
  condition: SQL<unknown>;
}

/**
 * Base Specification Interface
 * Implements the Specification Pattern for encapsulating business rules
 */
export abstract class Specification<T> {
  /**
   * Check if an entity satisfies this specification
   * Used for in-memory filtering
   */
  abstract isSatisfiedBy(candidate: T): boolean;

  /**
   * Convert specification to SQL clause for database queries
   * Used for efficient database filtering
   */
  abstract toSqlClause(): SQL<unknown>;

  /**
   * Combine specifications with AND logic
   */
  and(other: Specification<T>): AndSpecification<T> {
    return new AndSpecification(this, other);
  }

  /**
   * Combine specifications with OR logic
   */
  or(other: Specification<T>): OrSpecification<T> {
    return new OrSpecification(this, other);
  }

  /**
   * Negate this specification
   */
  not(): NotSpecification<T> {
    return new NotSpecification(this);
  }
}

/**
 * AND Specification - combines two specifications with AND logic
 */
export class AndSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate)
    );
  }

  toSqlClause(): SQL<unknown> {
    const leftClause = this.left.toSqlClause();
    const rightClause = this.right.toSqlClause();

    return and(leftClause, rightClause) as SQL<unknown>;
  }
}

/**
 * OR Specification - combines two specifications with OR logic
 */
export class OrSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate)
    );
  }

  toSqlClause(): SQL<unknown> {
    const leftClause = this.left.toSqlClause();
    const rightClause = this.right.toSqlClause();

    return or(leftClause, rightClause) as SQL<unknown>;
  }
}

/**
 * NOT Specification - negates a specification
 */
export class NotSpecification<T> extends Specification<T> {
  constructor(private readonly specification: Specification<T>) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.specification.isSatisfiedBy(candidate);
  }

  toSqlClause(): SQL<unknown> {
    const clause = this.specification.toSqlClause();

    return not(clause);
  }
}

/**
 * True Specification - always returns true
 * Useful for building composite specifications
 */
export class TrueSpecification<T> extends Specification<T> {
  isSatisfiedBy(_candidate: T): boolean {
    return true;
  }

  toSqlClause(): SQL<unknown> {
    return sql`1 = 1`;
  }
}
