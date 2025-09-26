import { ValueObject } from '../shared/value-object';

/**
 * Permit Status Value Object
 * Represents the lifecycle status of a regulatory permit
 */
export class PermitStatus extends ValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validate(_value);
  }

  public static readonly DRAFT = new PermitStatus('draft');
  public static readonly SUBMITTED = new PermitStatus('submitted');
  public static readonly UNDER_REVIEW = new PermitStatus('under_review');
  public static readonly APPROVED = new PermitStatus('approved');
  public static readonly DENIED = new PermitStatus('denied');
  public static readonly EXPIRED = new PermitStatus('expired');
  public static readonly RENEWED = new PermitStatus('renewed');

  public static create(value: string): PermitStatus {
    return new PermitStatus(value);
  }

  public static fromString(value: string): PermitStatus {
    switch (value) {
      case 'draft':
        return PermitStatus.DRAFT;
      case 'submitted':
        return PermitStatus.SUBMITTED;
      case 'under_review':
        return PermitStatus.UNDER_REVIEW;
      case 'approved':
        return PermitStatus.APPROVED;
      case 'denied':
        return PermitStatus.DENIED;
      case 'expired':
        return PermitStatus.EXPIRED;
      case 'renewed':
        return PermitStatus.RENEWED;
      default:
        throw new Error(`Invalid permit status: ${value}`);
    }
  }

  protected override validate(value: string): void {
    const validStatuses = [
      'draft',
      'submitted',
      'under_review',
      'approved',
      'denied',
      'expired',
      'renewed',
    ];

    if (!validStatuses.includes(value)) {
      throw new Error(`Invalid permit status: ${value}`);
    }
  }

  public get value(): string {
    return this._value;
  }

  public override equals(other: ValueObject): boolean {
    if (!(other instanceof PermitStatus)) {
      return false;
    }
    return this._value === other._value;
  }

  public override toString(): string {
    return this._value;
  }

  // Business logic methods
  public canTransitionTo(newStatus: PermitStatus): boolean {
    const transitions: Record<string, string[]> = {
      draft: ['submitted'],
      submitted: ['under_review', 'draft'],
      under_review: ['approved', 'denied', 'draft'],
      approved: ['expired', 'renewed'],
      denied: ['draft'],
      expired: ['renewed', 'draft'],
      renewed: ['expired', 'draft'],
    };

    return transitions[this._value]?.includes(newStatus._value) ?? false;
  }

  public isActive(): boolean {
    return ['approved', 'renewed'].includes(this._value);
  }

  public isTerminal(): boolean {
    return ['denied', 'expired'].includes(this._value);
  }
}
