import { ValueObject } from '../shared/value-object';

/**
 * Monitoring Type Value Object
 * Represents the different types of environmental monitoring
 */
export class MonitoringType extends ValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validate(_value);
  }

  public static readonly AIR = new MonitoringType('air');
  public static readonly WATER = new MonitoringType('water');
  public static readonly WASTE = new MonitoringType('waste');
  public static readonly GHG = new MonitoringType('ghg');
  public static readonly CONTINUOUS_EMISSION = new MonitoringType(
    'continuous_emission',
  );
  public static readonly LDAR = new MonitoringType('ldar');

  public static create(value: string): MonitoringType {
    return new MonitoringType(value);
  }

  public static fromString(value: string): MonitoringType {
    switch (value) {
      case 'air':
        return MonitoringType.AIR;
      case 'water':
        return MonitoringType.WATER;
      case 'waste':
        return MonitoringType.WASTE;
      case 'ghg':
        return MonitoringType.GHG;
      case 'continuous_emission':
        return MonitoringType.CONTINUOUS_EMISSION;
      case 'ldar':
        return MonitoringType.LDAR;
      default:
        throw new Error(`Invalid monitoring type: ${value}`);
    }
  }

  protected override validate(value: string): void {
    const validTypes = [
      'air',
      'water',
      'waste',
      'ghg',
      'continuous_emission',
      'ldar',
    ];

    if (!validTypes.includes(value)) {
      throw new Error(`Invalid monitoring type: ${value}`);
    }
  }

  public get value(): string {
    return this._value;
  }

  public override equals(other: ValueObject): boolean {
    if (!(other instanceof MonitoringType)) {
      return false;
    }
    return this._value === other._value;
  }

  public override toString(): string {
    return this._value;
  }

  // Business logic methods
  public requiresContinuousMonitoring(): boolean {
    return ['continuous_emission', 'ldar'].includes(this._value);
  }

  public isEmissionRelated(): boolean {
    return ['air', 'ghg', 'continuous_emission', 'ldar'].includes(this._value);
  }

  public isWaterRelated(): boolean {
    return ['water', 'waste'].includes(this._value);
  }

  public requiresCalibration(): boolean {
    return ['continuous_emission', 'ldar'].includes(this._value);
  }

  public getReportingFrequency():
    | 'hourly'
    | 'daily'
    | 'monthly'
    | 'quarterly'
    | 'annual' {
    const frequencyMap: Record<
      string,
      'hourly' | 'daily' | 'monthly' | 'quarterly' | 'annual'
    > = {
      air: 'monthly',
      water: 'monthly',
      waste: 'quarterly',
      ghg: 'annual',
      continuous_emission: 'hourly',
      ldar: 'monthly',
    };

    return frequencyMap[this._value] ?? 'monthly';
  }
}
