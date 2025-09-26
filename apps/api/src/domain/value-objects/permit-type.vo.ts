import { ValueObject } from '../shared/value-object';

/**
 * Permit Type Value Object
 * Represents the different types of regulatory permits
 */
export class PermitType extends ValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validate(_value);
  }

  public static readonly DRILLING = new PermitType('drilling');
  public static readonly COMPLETION = new PermitType('completion');
  public static readonly WORKOVER = new PermitType('workover');
  public static readonly INJECTION = new PermitType('injection');
  public static readonly DISPOSAL = new PermitType('disposal');
  public static readonly FACILITY = new PermitType('facility');
  public static readonly PIPELINE = new PermitType('pipeline');
  public static readonly ENVIRONMENTAL = new PermitType('environmental');

  public static create(value: string): PermitType {
    return new PermitType(value);
  }

  public static fromString(value: string): PermitType {
    switch (value) {
      case 'drilling':
        return PermitType.DRILLING;
      case 'completion':
        return PermitType.COMPLETION;
      case 'workover':
        return PermitType.WORKOVER;
      case 'injection':
        return PermitType.INJECTION;
      case 'disposal':
        return PermitType.DISPOSAL;
      case 'facility':
        return PermitType.FACILITY;
      case 'pipeline':
        return PermitType.PIPELINE;
      case 'environmental':
        return PermitType.ENVIRONMENTAL;
      default:
        throw new Error(`Invalid permit type: ${value}`);
    }
  }

  protected override validate(value: string): void {
    const validTypes = [
      'drilling',
      'completion',
      'workover',
      'injection',
      'disposal',
      'facility',
      'pipeline',
      'environmental',
    ];

    if (!validTypes.includes(value)) {
      throw new Error(`Invalid permit type: ${value}`);
    }
  }

  public get value(): string {
    return this._value;
  }

  public override equals(other: ValueObject): boolean {
    if (!(other instanceof PermitType)) {
      return false;
    }
    return this._value === other._value;
  }

  public override toString(): string {
    return this._value;
  }

  // Business logic methods
  public requiresEnvironmentalReview(): boolean {
    return ['injection', 'disposal', 'environmental'].includes(this._value);
  }

  public requiresWellAssociation(): boolean {
    return ['drilling', 'completion', 'workover', 'injection'].includes(
      this._value,
    );
  }

  public hasRenewalRequirements(): boolean {
    return ['facility', 'pipeline', 'disposal', 'injection'].includes(
      this._value,
    );
  }

  public getDefaultExpirationMonths(): number {
    const expirationMap: Record<string, number> = {
      drilling: 24, // 2 years
      completion: 12, // 1 year
      workover: 12, // 1 year
      injection: 60, // 5 years
      disposal: 60, // 5 years
      facility: 120, // 10 years
      pipeline: 120, // 10 years
      environmental: 60, // 5 years
    };

    return expirationMap[this._value] ?? 12;
  }
}
