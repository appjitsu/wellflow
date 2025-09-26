/**
 * Factory creation result
 */
export interface FactoryResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

/**
 * Base factory interface
 */
export interface IFactory<TInput, TOutput> {
  /**
   * Create an instance of TOutput from TInput
   */
  create(input: TInput): Promise<FactoryResult<TOutput>>;

  /**
   * Validate input before creation
   */
  validate(
    input: TInput,
  ): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }>;

  /**
   * Get factory metadata
   */
  getMetadata(): {
    factoryType: string;
    supportedTypes: string[];
    version: string;
  };
}

/**
 * Entity factory interface for domain entities
 */
export interface IEntityFactory<TInput, TEntity>
  extends IFactory<TInput, TEntity> {
  /**
   * Create entity with default values
   */
  createWithDefaults(
    input: Partial<TInput>,
    defaults: Partial<TInput>,
  ): Promise<FactoryResult<TEntity>>;

  /**
   * Create entity from existing data (for reconstruction)
   */
  createFromExisting(
    input: TInput,
    existingData: Record<string, unknown>,
  ): Promise<FactoryResult<TEntity>>;
}

/**
 * Value object factory interface
 */
export interface IValueObjectFactory<TInput, TValueObject>
  extends IFactory<TInput, TValueObject> {
  /**
   * Create value object from string representation
   */
  fromString(value: string): Promise<FactoryResult<TValueObject>>;

  /**
   * Create value object from multiple values
   */
  fromValues(...values: unknown[]): Promise<FactoryResult<TValueObject>>;

  /**
   * Get all possible values for this value object type
   */
  getPossibleValues(): Promise<string[]>;
}

/**
 * Aggregate factory interface for complex aggregates
 */
export interface IAggregateFactory<TInput, TAggregate>
  extends IEntityFactory<TInput, TAggregate> {
  /**
   * Create aggregate with related entities
   */
  createWithRelated(
    input: TInput,
    relatedData: Record<string, unknown>,
  ): Promise<FactoryResult<TAggregate>>;

  /**
   * Reconstruct aggregate from stored state
   */
  reconstructFromState(
    state: Record<string, unknown>,
  ): Promise<FactoryResult<TAggregate>>;
}
