import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  IFactory,
  IEntityFactory,
  IValueObjectFactory,
  IAggregateFactory,
  FactoryResult,
} from './factory.interface';
import { PermitFactory } from './permit.factory';
import {
  PermitTypeFactory,
  PermitStatusFactory,
  IncidentTypeFactory,
  IncidentSeverityFactory,
  MonitoringTypeFactory,
  ReportTypeFactory,
  ReportStatusFactory,
} from './value-object.factory';

export type FactoryType = 'entity' | 'aggregate' | 'valueObject';

/**
 * Factory Registration
 */
export interface FactoryRegistration {
  type: FactoryType;
  factoryType: string;
  factory: IFactory<unknown, unknown>;
}

/**
 * Regulatory Factory Manager Service
 * Central registry and orchestrator for all regulatory factories
 * Provides unified interface for creating domain objects with validation
 */
@Injectable()
export class RegulatoryFactoryManagerService {
  private readonly logger = new Logger(RegulatoryFactoryManagerService.name);

  // Factory registries
  private readonly entityFactories = new Map<
    string,
    IEntityFactory<unknown, unknown>
  >();
  private readonly aggregateFactories = new Map<
    string,
    IAggregateFactory<unknown, unknown>
  >();
  private readonly valueObjectFactories = new Map<
    string,
    IValueObjectFactory<unknown, unknown>
  >();
  private readonly allFactories = new Map<string, IFactory<unknown, unknown>>();

  constructor(private readonly moduleRef: ModuleRef) {
    // eslint-disable-next-line sonarjs/no-async-constructor
    void this.initializeFactories();
  }

  /**
   * Initialize all regulatory factories
   */
  private async initializeFactories(): Promise<void> {
    // Entity Factories
    const permitFactory = await this.moduleRef.create(PermitFactory);
    this.registerEntityFactory('Permit', permitFactory);

    // Value Object Factories
    const permitTypeFactory = await this.moduleRef.create(PermitTypeFactory);
    this.registerValueObjectFactory('PermitType', permitTypeFactory);

    const permitStatusFactory =
      await this.moduleRef.create(PermitStatusFactory);
    this.registerValueObjectFactory('PermitStatus', permitStatusFactory);

    const incidentTypeFactory =
      await this.moduleRef.create(IncidentTypeFactory);
    this.registerValueObjectFactory('IncidentType', incidentTypeFactory);

    const incidentSeverityFactory = await this.moduleRef.create(
      IncidentSeverityFactory,
    );
    this.registerValueObjectFactory(
      'IncidentSeverity',
      incidentSeverityFactory,
    );

    const monitoringTypeFactory = await this.moduleRef.create(
      MonitoringTypeFactory,
    );
    this.registerValueObjectFactory('MonitoringType', monitoringTypeFactory);

    const reportTypeFactory = await this.moduleRef.create(ReportTypeFactory);
    this.registerValueObjectFactory('ReportType', reportTypeFactory);

    const reportStatusFactory =
      await this.moduleRef.create(ReportStatusFactory);
    this.registerValueObjectFactory('ReportStatus', reportStatusFactory);

    this.logger.log(
      `Initialized regulatory factories: ${this.allFactories.size} total factories`,
    );
  }

  /**
   * Create entity using specified factory
   */
  async createEntity<TInput, TEntity>(
    factoryType: string,
    input: TInput,
  ): Promise<FactoryResult<TEntity>> {
    const factory = this.entityFactories.get(factoryType);
    if (!factory) {
      return {
        success: false,
        errors: [`Entity factory not found: ${factoryType}`],
      };
    }

    return factory.create(input) as Promise<FactoryResult<TEntity>>;
  }

  /**
   * Create aggregate using specified factory
   */
  async createAggregate<TInput, TAggregate>(
    factoryType: string,
    input: TInput,
  ): Promise<FactoryResult<TAggregate>> {
    const factory = this.aggregateFactories.get(factoryType);
    if (!factory) {
      return {
        success: false,
        errors: [`Aggregate factory not found: ${factoryType}`],
      };
    }

    return factory.create(input) as Promise<FactoryResult<TAggregate>>;
  }

  /**
   * Create aggregate with default values
   */
  async createAggregateWithDefaults<TInput, TAggregate>(
    factoryType: string,
    input: Partial<TInput>,
    defaults: Partial<TInput>,
  ): Promise<FactoryResult<TAggregate>> {
    const factory = this.aggregateFactories.get(factoryType);
    if (!factory) {
      return {
        success: false,
        errors: [`Aggregate factory not found: ${factoryType}`],
      };
    }

    return factory.createWithDefaults(input, defaults) as Promise<
      FactoryResult<TAggregate>
    >;
  }

  /**
   * Create aggregate from existing data
   */
  async createAggregateFromExisting<TInput, TAggregate>(
    factoryType: string,
    input: TInput,
    existingData: Record<string, unknown>,
  ): Promise<FactoryResult<TAggregate>> {
    const factory = this.aggregateFactories.get(factoryType);
    if (!factory) {
      return {
        success: false,
        errors: [`Aggregate factory not found: ${factoryType}`],
      };
    }

    return factory.createFromExisting(input, existingData) as Promise<
      FactoryResult<TAggregate>
    >;
  }

  /**
   * Reconstruct aggregate from stored state
   */
  async reconstructAggregate<TAggregate>(
    factoryType: string,
    state: Record<string, unknown>,
  ): Promise<FactoryResult<TAggregate>> {
    const factory = this.aggregateFactories.get(factoryType);
    if (!factory) {
      return {
        success: false,
        errors: [`Aggregate factory not found: ${factoryType}`],
      };
    }

    return factory.reconstructFromState(state) as Promise<
      FactoryResult<TAggregate>
    >;
  }

  /**
   * Create value object from string
   */
  async createValueObjectFromString<TValueObject>(
    factoryType: string,
    value: string,
  ): Promise<FactoryResult<TValueObject>> {
    const factory = this.valueObjectFactories.get(factoryType);
    if (!factory) {
      return {
        success: false,
        errors: [`Value object factory not found: ${factoryType}`],
      };
    }

    return factory.fromString(value) as Promise<FactoryResult<TValueObject>>;
  }

  /**
   * Create value object from multiple values
   */
  async createValueObjectFromValues<TValueObject>(
    factoryType: string,
    ...values: unknown[]
  ): Promise<FactoryResult<TValueObject>> {
    const factory = this.valueObjectFactories.get(factoryType);
    if (!factory) {
      return {
        success: false,
        errors: [`Value object factory not found: ${factoryType}`],
      };
    }

    return factory.fromValues(...values) as Promise<
      FactoryResult<TValueObject>
    >;
  }

  /**
   * Get possible values for value object type
   */
  async getPossibleValues(factoryType: string): Promise<string[]> {
    const factory = this.valueObjectFactories.get(factoryType);
    if (!factory) {
      this.logger.warn(`Value object factory not found: ${factoryType}`);
      return [];
    }

    return factory.getPossibleValues();
  }

  /**
   * Validate input for any factory type
   */
  async validateFactoryInput(
    factoryType: string,
    input: unknown,
    factoryCategory: FactoryType = 'aggregate',
  ): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }> {
    let factory: IFactory<unknown, unknown> | undefined;

    switch (factoryCategory) {
      case 'entity':
        factory = this.entityFactories.get(factoryType);
        break;
      case 'aggregate':
        factory = this.aggregateFactories.get(factoryType);
        break;
      case 'valueObject':
        factory = this.valueObjectFactories.get(factoryType);
        break;
    }

    if (!factory) {
      return {
        isValid: false,
        errors: [`Factory not found: ${factoryType} (${factoryCategory})`],
      };
    }

    return factory.validate(input);
  }

  /**
   * Get factory metadata
   */
  getFactoryMetadata(factoryType: string): {
    factoryType: string;
    supportedTypes: string[];
    version: string;
  } | null {
    const factory = this.allFactories.get(factoryType);
    if (!factory) {
      return null;
    }

    return factory.getMetadata();
  }

  /**
   * Get all available factories
   */
  getAvailableFactories(): {
    entities: string[];
    aggregates: string[];
    valueObjects: string[];
  } {
    return {
      entities: Array.from(this.entityFactories.keys()),
      aggregates: Array.from(this.aggregateFactories.keys()),
      valueObjects: Array.from(this.valueObjectFactories.keys()),
    };
  }

  /**
   * Register custom entity factory
   */
  registerEntityFactory(
    factoryType: string,
    factory: IEntityFactory<unknown, unknown>,
  ): void {
    this.entityFactories.set(factoryType, factory);
    this.allFactories.set(factoryType, factory);
    this.logger.log(`Registered entity factory: ${factoryType}`);
  }

  /**
   * Register custom aggregate factory
   */
  registerAggregateFactory(
    factoryType: string,
    factory: IAggregateFactory<unknown, unknown>,
  ): void {
    this.aggregateFactories.set(factoryType, factory);
    this.allFactories.set(factoryType, factory);
    this.logger.log(`Registered aggregate factory: ${factoryType}`);
  }

  /**
   * Register custom value object factory
   */
  registerValueObjectFactory(
    factoryType: string,
    factory: IValueObjectFactory<unknown, unknown>,
  ): void {
    this.valueObjectFactories.set(factoryType, factory);
    this.allFactories.set(factoryType, factory);
    this.logger.log(`Registered value object factory: ${factoryType}`);
  }

  /**
   * Remove factory registration
   */
  removeFactory(factoryType: string): boolean {
    let removed = false;

    if (this.entityFactories.delete(factoryType)) {
      removed = true;
    }

    if (this.aggregateFactories.delete(factoryType)) {
      removed = true;
    }

    if (this.valueObjectFactories.delete(factoryType)) {
      removed = true;
    }

    if (this.allFactories.delete(factoryType)) {
      this.logger.log(`Removed factory: ${factoryType}`);
    }

    return removed;
  }

  /**
   * Batch create multiple objects
   */
  async batchCreate(
    requests: Array<{
      factoryType: string;
      factoryCategory: FactoryType;
      input: unknown;
    }>,
  ): Promise<Array<FactoryResult<unknown>>> {
    const results: Array<FactoryResult<unknown>> = [];

    for (const request of requests) {
      try {
        let result: FactoryResult<unknown>;

        switch (request.factoryCategory) {
          case 'entity':
            result = await this.createEntity(
              request.factoryType,
              request.input,
            );
            break;
          case 'aggregate':
            result = await this.createAggregate(
              request.factoryType,
              request.input,
            );
            break;
          case 'valueObject':
            if (typeof request.input === 'string') {
              result = await this.createValueObjectFromString(
                request.factoryType,
                request.input,
              );
            } else {
              result = {
                success: false,
                errors: ['Invalid input for value object creation'],
              };
            }
            break;
          default:
            result = {
              success: false,
              errors: [
                `Unknown factory category: ${request.factoryCategory as string}`,
              ],
            };
        }

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          errors: [
            error instanceof Error ? error.message : 'Batch creation error',
          ],
        });
      }
    }

    return results;
  }

  /**
   * Get factory statistics
   */
  getFactoryStatistics(): {
    totalFactories: number;
    entityFactories: number;
    aggregateFactories: number;
    valueObjectFactories: number;
    factoryTypes: string[];
  } {
    return {
      totalFactories: this.allFactories.size,
      entityFactories: this.entityFactories.size,
      aggregateFactories: this.aggregateFactories.size,
      valueObjectFactories: this.valueObjectFactories.size,
      factoryTypes: Array.from(this.allFactories.keys()),
    };
  }
}
