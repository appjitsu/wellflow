import { ValueObject } from '../shared/value-object';

/**
 * Incident Severity Value Object
 * Represents the severity levels of HSE incidents
 */
export class IncidentSeverity extends ValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validate(_value);
  }

  public static readonly LOW = new IncidentSeverity('low');
  public static readonly MEDIUM = new IncidentSeverity('medium');
  public static readonly HIGH = new IncidentSeverity('high');
  public static readonly CRITICAL = new IncidentSeverity('critical');

  public static create(value: string): IncidentSeverity {
    return new IncidentSeverity(value);
  }

  public static fromString(value: string): IncidentSeverity {
    switch (value) {
      case 'low':
        return IncidentSeverity.LOW;
      case 'medium':
        return IncidentSeverity.MEDIUM;
      case 'high':
        return IncidentSeverity.HIGH;
      case 'critical':
        return IncidentSeverity.CRITICAL;
      default:
        throw new Error(`Invalid incident severity: ${value}`);
    }
  }

  protected override validate(value: string): void {
    const validSeverities = ['low', 'medium', 'high', 'critical'];

    if (!validSeverities.includes(value)) {
      throw new Error(`Invalid incident severity: ${value}`);
    }
  }

  public get value(): string {
    return this._value;
  }

  public override equals(other: ValueObject): boolean {
    if (!(other instanceof IncidentSeverity)) {
      return false;
    }
    return this._value === other._value;
  }

  public override toString(): string {
    return this._value;
  }

  // Business logic methods
  public requiresImmediateResponse(): boolean {
    return ['high', 'critical'].includes(this._value);
  }

  public requiresSeniorManagementNotification(): boolean {
    return ['high', 'critical'].includes(this._value);
  }

  public requiresRegulatoryNotification(): boolean {
    return ['medium', 'high', 'critical'].includes(this._value);
  }

  public getNotificationPriority(): 'low' | 'medium' | 'high' | 'critical' {
    const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> =
      {
        low: 'low',
        medium: 'medium',
        high: 'high',
        critical: 'critical',
      };

    return priorityMap[this._value] || 'low';
  }

  public getEscalationHours(): number {
    const escalationMap: Record<string, number> = {
      low: 24, // 1 day
      medium: 4, // 4 hours
      high: 1, // 1 hour
      critical: 0.25, // 15 minutes
    };

    return escalationMap[this._value] || 24;
  }

  public canTransitionTo(newSeverity: IncidentSeverity): boolean {
    // Severity can be upgraded but not downgraded
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    return (
      (severityLevels[newSeverity._value as keyof typeof severityLevels] ||
        0) >= (severityLevels[this._value as keyof typeof severityLevels] || 0)
    );
  }
}
