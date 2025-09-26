import {
  CompositeSpecification,
  SpecificationMetadata,
} from './specification.interface';

/**
 * Base Specification class
 * Simple implementation of the specification pattern
 */
export abstract class Specification<T> extends CompositeSpecification<T> {
  abstract override isSatisfiedBy(candidate: T): Promise<boolean>;

  abstract override getMetadata(): SpecificationMetadata;
}
