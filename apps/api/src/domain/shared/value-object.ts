/**
 * Base class for Value Objects
 * Value Objects are immutable objects that represent domain concepts
 */
export abstract class ValueObject<T = unknown> {
  /**
   * Override this method to implement custom validation logic
   * @param value The value to validate
   */
  protected validate(_value: T): void {
    // Default implementation - no validation
  }

  /**
   * Check if this ValueObject is equal to another ValueObject
   * @param other The other ValueObject to compare with
   * @returns true if they are equal, false otherwise
   */
  public equals(other: ValueObject): boolean {
    if (!other) return false;
    if (this.constructor !== other.constructor) return false;

    // Simple equality check - override for complex objects
    return JSON.stringify(this) === JSON.stringify(other);
  }

  /**
   * String representation of the value object
   * @returns string representation
   */
  public toString(): string {
    return JSON.stringify(this);
  }
}
