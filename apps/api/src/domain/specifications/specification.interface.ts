/**
 * Specification pattern interface
 * Encapsulates business rules that can be combined and reused
 */
export interface ISpecification<T> {
  /**
   * Check if candidate satisfies the specification
   */
  isSatisfiedBy(candidate: T): Promise<boolean>;

  /**
   * Combine with another specification using AND
   */
  and(other: ISpecification<T>): ISpecification<T>;

  /**
   * Combine with another specification using OR
   */
  or(other: ISpecification<T>): ISpecification<T>;

  /**
   * Negate the specification (NOT)
   */
  not(): ISpecification<T>;

  /**
   * Get specification metadata
   */
  getMetadata(): SpecificationMetadata;
}

/**
 * Specification metadata
 */
export interface SpecificationMetadata {
  name: string;
  description: string;
  priority: number;
  category: string;
  tags: string[];
}

/**
 * Composite specification for combining multiple specifications
 */
export abstract class CompositeSpecification<T> implements ISpecification<T> {
  abstract isSatisfiedBy(candidate: T): Promise<boolean>;
  abstract getMetadata(): SpecificationMetadata;

  and(other: ISpecification<T>): ISpecification<T> {
    return new AndSpecification(this, other);
  }

  or(other: ISpecification<T>): ISpecification<T> {
    return new OrSpecification(this, other);
  }

  not(): ISpecification<T> {
    return new NotSpecification(this);
  }
}

/**
 * AND specification combinator
 */
export class AndSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private left: ISpecification<T>,
    private right: ISpecification<T>,
  ) {
    super();
  }

  async isSatisfiedBy(candidate: T): Promise<boolean> {
    const [leftResult, rightResult] = await Promise.all([
      this.left.isSatisfiedBy(candidate),
      this.right.isSatisfiedBy(candidate),
    ]);
    return leftResult && rightResult;
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: `And(${this.left.getMetadata().name}, ${this.right.getMetadata().name})`,
      description: `Combines ${this.left.getMetadata().name} AND ${this.right.getMetadata().name}`,
      priority: Math.max(
        this.left.getMetadata().priority,
        this.right.getMetadata().priority,
      ),
      category: 'composite',
      tags: [
        ...this.left.getMetadata().tags,
        ...this.right.getMetadata().tags,
        'and',
      ],
    };
  }
}

/**
 * OR specification combinator
 */
export class OrSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private left: ISpecification<T>,
    private right: ISpecification<T>,
  ) {
    super();
  }

  async isSatisfiedBy(candidate: T): Promise<boolean> {
    const [leftResult, rightResult] = await Promise.all([
      this.left.isSatisfiedBy(candidate),
      this.right.isSatisfiedBy(candidate),
    ]);
    return leftResult || rightResult;
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: `Or(${this.left.getMetadata().name}, ${this.right.getMetadata().name})`,
      description: `Combines ${this.left.getMetadata().name} OR ${this.right.getMetadata().name}`,
      priority: Math.max(
        this.left.getMetadata().priority,
        this.right.getMetadata().priority,
      ),
      category: 'composite',
      tags: [
        ...this.left.getMetadata().tags,
        ...this.right.getMetadata().tags,
        'or',
      ],
    };
  }
}

/**
 * NOT specification combinator
 */
export class NotSpecification<T> extends CompositeSpecification<T> {
  constructor(private spec: ISpecification<T>) {
    super();
  }

  async isSatisfiedBy(candidate: T): Promise<boolean> {
    const result = await this.spec.isSatisfiedBy(candidate);
    return !result;
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: `Not(${this.spec.getMetadata().name})`,
      description: `Negates ${this.spec.getMetadata().name}`,
      priority: this.spec.getMetadata().priority,
      category: 'composite',
      tags: [...this.spec.getMetadata().tags, 'not'],
    };
  }
}
