import { ValueObject } from '../shared/value-object';

/**
 * Incident Type Value Object
 * Represents the different types of HSE incidents
 */
export class IncidentType extends ValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validate(_value);
  }

  public static readonly SPILL = new IncidentType('spill');
  public static readonly RELEASE = new IncidentType('release');
  public static readonly INJURY = new IncidentType('injury');
  public static readonly FATALITY = new IncidentType('fatality');
  public static readonly NEAR_MISS = new IncidentType('near_miss');
  public static readonly EQUIPMENT_FAILURE = new IncidentType(
    'equipment_failure',
  );
  public static readonly WELL_CONTROL = new IncidentType('well_control');
  public static readonly FIRE = new IncidentType('fire');
  public static readonly EXPLOSION = new IncidentType('explosion');

  public static create(value: string): IncidentType {
    return new IncidentType(value);
  }

  public static fromString(value: string): IncidentType {
    switch (value) {
      case 'spill':
        return IncidentType.SPILL;
      case 'release':
        return IncidentType.RELEASE;
      case 'injury':
        return IncidentType.INJURY;
      case 'fatality':
        return IncidentType.FATALITY;
      case 'near_miss':
        return IncidentType.NEAR_MISS;
      case 'equipment_failure':
        return IncidentType.EQUIPMENT_FAILURE;
      case 'well_control':
        return IncidentType.WELL_CONTROL;
      case 'fire':
        return IncidentType.FIRE;
      case 'explosion':
        return IncidentType.EXPLOSION;
      default:
        throw new Error(`Invalid incident type: ${value}`);
    }
  }

  protected override validate(value: string): void {
    const validTypes = [
      'spill',
      'release',
      'injury',
      'fatality',
      'near_miss',
      'equipment_failure',
      'well_control',
      'fire',
      'explosion',
    ];

    if (!validTypes.includes(value)) {
      throw new Error(`Invalid incident type: ${value}`);
    }
  }

  public get value(): string {
    return this._value;
  }

  public override equals(other: ValueObject): boolean {
    if (!(other instanceof IncidentType)) {
      return false;
    }
    return this._value === other._value;
  }

  public override toString(): string {
    return this._value;
  }

  // Business logic methods
  public requiresImmediateNotification(): boolean {
    return ['fatality', 'explosion', 'fire', 'well_control'].includes(
      this._value,
    );
  }

  public requiresEnvironmentalAssessment(): boolean {
    return ['spill', 'release', 'explosion'].includes(this._value);
  }

  public requiresMedicalResponse(): boolean {
    return ['injury', 'fatality'].includes(this._value);
  }

  public isSafetyCritical(): boolean {
    return ['fatality', 'injury', 'explosion', 'fire', 'well_control'].includes(
      this._value,
    );
  }

  public getDefaultSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> =
      {
        near_miss: 'low',
        equipment_failure: 'medium',
        spill: 'medium',
        release: 'medium',
        injury: 'high',
        fire: 'high',
        well_control: 'high',
        explosion: 'critical',
        fatality: 'critical',
      };

    return severityMap[this._value] ?? 'medium';
  }
}
