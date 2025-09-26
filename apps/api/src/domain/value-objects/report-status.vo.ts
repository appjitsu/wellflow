import { ValueObject } from '../shared/value-object';

/**
 * Report Status Value Object
 * Represents the different statuses a regulatory report can have in its lifecycle
 */
export class ReportStatus extends ValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validate(_value);
  }

  public static readonly DRAFT = new ReportStatus('draft');
  public static readonly GENERATING = new ReportStatus('generating');
  public static readonly GENERATED = new ReportStatus('generated');
  public static readonly REVIEWING = new ReportStatus('reviewing');
  public static readonly APPROVED = new ReportStatus('approved');
  public static readonly SUBMITTED = new ReportStatus('submitted');
  public static readonly ACCEPTED = new ReportStatus('accepted');
  public static readonly REJECTED = new ReportStatus('rejected');
  public static readonly OVERDUE = new ReportStatus('overdue');

  public static create(value: string): ReportStatus {
    return new ReportStatus(value);
  }

  public static fromString(value: string): ReportStatus {
    switch (value) {
      case 'draft':
        return ReportStatus.DRAFT;
      case 'generating':
        return ReportStatus.GENERATING;
      case 'generated':
        return ReportStatus.GENERATED;
      case 'reviewing':
        return ReportStatus.REVIEWING;
      case 'approved':
        return ReportStatus.APPROVED;
      case 'submitted':
        return ReportStatus.SUBMITTED;
      case 'accepted':
        return ReportStatus.ACCEPTED;
      case 'rejected':
        return ReportStatus.REJECTED;
      case 'overdue':
        return ReportStatus.OVERDUE;
      default:
        throw new Error(`Invalid report status: ${value}`);
    }
  }

  protected override validate(value: string): void {
    const validStatuses = [
      'draft',
      'generating',
      'generated',
      'reviewing',
      'approved',
      'submitted',
      'accepted',
      'rejected',
      'overdue',
    ];

    if (validStatuses.indexOf(value) === -1) {
      throw new Error(`Invalid report status: ${value}`);
    }
  }

  public get value(): string {
    return this._value;
  }

  public canTransitionTo(newStatus: ReportStatus): boolean {
    const transitions: Record<string, string[]> = {
      draft: ['generating', 'generated'],
      generating: ['generated', 'draft'],
      generated: ['reviewing', 'approved', 'rejected'],
      reviewing: ['approved', 'rejected', 'generated'],
      approved: ['submitted', 'rejected'],
      submitted: ['accepted', 'rejected'],
      accepted: [], // Terminal state
      rejected: ['draft', 'generated'], // Can restart process
      overdue: ['submitted', 'draft'], // Can still submit or restart
    };

    const allowedStatuses = transitions[this._value] || [];
    return allowedStatuses.indexOf(newStatus.value) !== -1;
  }

  public isTerminal(): boolean {
    return ['accepted', 'rejected'].indexOf(this._value) !== -1;
  }

  public isOverdue(): boolean {
    return this._value === 'overdue';
  }

  public isPending(): boolean {
    return ['draft', 'generating', 'reviewing'].indexOf(this._value) !== -1;
  }

  public isSubmitted(): boolean {
    return ['submitted', 'accepted'].indexOf(this._value) !== -1;
  }
}
