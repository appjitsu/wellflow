import { ValueObject } from '../shared/value-object';

/**
 * Report Type Value Object
 * Represents the different types of regulatory reports
 */
export class ReportType extends ValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validate(_value);
  }

  public static readonly PRODUCTION = new ReportType('production');
  public static readonly ENVIRONMENTAL = new ReportType('environmental');
  public static readonly HSE = new ReportType('hse');
  public static readonly PERMIT = new ReportType('permit');
  public static readonly WASTE = new ReportType('waste');

  public static create(value: string): ReportType {
    return new ReportType(value);
  }

  public static fromString(value: string): ReportType {
    switch (value) {
      case 'production':
        return ReportType.PRODUCTION;
      case 'environmental':
        return ReportType.ENVIRONMENTAL;
      case 'hse':
        return ReportType.HSE;
      case 'permit':
        return ReportType.PERMIT;
      case 'waste':
        return ReportType.WASTE;
      default:
        throw new Error(`Invalid report type: ${value}`);
    }
  }

  protected override validate(value: string): void {
    const validTypes = [
      'production',
      'environmental',
      'hse',
      'permit',
      'waste',
    ];

    if (validTypes.indexOf(value) === -1) {
      throw new Error(`Invalid report type: ${value}`);
    }
  }

  public get value(): string {
    return this._value;
  }

  public requiresWellAssociation(): boolean {
    return (
      ['production', 'environmental', 'permit'].indexOf(this._value) !== -1
    );
  }

  public isEnvironmentalReport(): boolean {
    return ['environmental', 'waste'].indexOf(this._value) !== -1;
  }

  public isSafetyReport(): boolean {
    return this._value === 'hse';
  }

  public isProductionReport(): boolean {
    return this._value === 'production';
  }
}
