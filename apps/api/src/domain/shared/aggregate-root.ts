/**
 * Base class for all aggregate roots in the domain
 * Provides common functionality for domain events and aggregate state management
 */
export abstract class AggregateRoot {
  private domainEvents: any[] = [];

  /**
   * Get all domain events
   */
  getDomainEvents(): any[] {
    return [...this.domainEvents];
  }

  /**
   * Add a domain event
   */
  protected addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }

  /**
   * Clear all domain events
   */
  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  /**
   * Check if aggregate has domain events
   */
  hasDomainEvents(): boolean {
    return this.domainEvents.length > 0;
  }
}
