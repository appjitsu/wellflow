export enum CurativeStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  WAIVED = 'waived',
}

export type CurativePriority = 'high' | 'medium' | 'low';

export interface CurativeItemProps {
  id: string;
  titleOpinionId: string;
  itemNumber: string;
  defectType: string;
  description: string;
  priority: CurativePriority;
  status?: CurativeStatus;
  assignedTo?: string;
  dueDate?: Date;
  resolutionDate?: Date;
  resolutionNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
}

import { IEvent } from '@nestjs/cqrs';
import { CurativeItemStatusChangedEvent } from '../events/curative-item-status-changed.event';
import { CurativeItemAssignedEvent } from '../events/curative-item-assigned.event';
import { CurativeItemDueDateChangedEvent } from '../events/curative-item-due-date-changed.event';

/**
 * CurativeItem Entity - Represents a specific title defect and its remediation
 */
export class CurativeItem {
  private id: string;
  private titleOpinionId: string;
  private itemNumber: string;
  private defectType: string;
  private description: string;
  private priority: CurativePriority;
  private status: CurativeStatus;
  private assignedTo?: string;
  private dueDate?: Date;
  private resolutionDate?: Date;
  private resolutionNotes?: string;
  private createdAt: Date;
  private updatedAt: Date;
  private version: number;
  private domainEvents: IEvent[] = [];

  constructor(props: CurativeItemProps) {
    this.id = props.id;
    this.titleOpinionId = props.titleOpinionId;
    this.itemNumber = props.itemNumber;
    this.defectType = props.defectType;
    this.description = props.description;
    this.priority = props.priority;
    this.status = props.status ?? CurativeStatus.OPEN;
    this.assignedTo = props.assignedTo;
    this.dueDate = props.dueDate ? new Date(props.dueDate) : undefined;
    this.resolutionDate = props.resolutionDate
      ? new Date(props.resolutionDate)
      : undefined;
    this.resolutionNotes = props.resolutionNotes;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.version = props.version ?? 1;
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getTitleOpinionId(): string {
    return this.titleOpinionId;
  }
  getItemNumber(): string {
    return this.itemNumber;
  }
  getDefectType(): string {
    return this.defectType;
  }
  getDescription(): string {
    return this.description;
  }
  getPriority(): CurativePriority {
    return this.priority;
  }
  getStatus(): CurativeStatus {
    return this.status;
  }
  getAssignedTo(): string | undefined {
    return this.assignedTo;
  }
  getDueDate(): Date | undefined {
    return this.dueDate ? new Date(this.dueDate) : undefined;
  }
  getResolutionDate(): Date | undefined {
    return this.resolutionDate ? new Date(this.resolutionDate) : undefined;
  }
  getResolutionNotes(): string | undefined {
    return this.resolutionNotes;
  }

  // Behavior
  updateStatus(
    newStatus: CurativeStatus,
    updatedBy: string,
    notes?: string,
  ): void {
    const previousStatus = this.status;

    switch (newStatus) {
      case CurativeStatus.IN_PROGRESS:
        if (this.status !== CurativeStatus.OPEN) return;
        this.status = CurativeStatus.IN_PROGRESS;
        break;
      case CurativeStatus.RESOLVED:
        if (this.status === CurativeStatus.RESOLVED) return;
        this.status = CurativeStatus.RESOLVED;
        this.resolutionNotes = notes ?? this.resolutionNotes;
        this.resolutionDate = new Date();
        break;
      case CurativeStatus.WAIVED:
        if (this.status === CurativeStatus.RESOLVED) {
          throw new Error('Cannot waive a resolved item');
        }
        this.status = CurativeStatus.WAIVED;
        this.resolutionNotes = notes ?? this.resolutionNotes;
        break;
      default:
        throw new Error(`Invalid status: ${newStatus}`);
    }

    this.touch();

    // Raise domain event
    this.addDomainEvent(
      new CurativeItemStatusChangedEvent(
        this.id,
        previousStatus,
        newStatus,
        updatedBy,
        notes,
      ),
    );
  }

  startProgress(assignee?: string): void {
    if (this.status !== CurativeStatus.OPEN) return;
    this.status = CurativeStatus.IN_PROGRESS;
    this.assignedTo = assignee ?? this.assignedTo;
    this.touch();
  }

  resolve(notes?: string, resolutionDate?: Date): void {
    if (this.status === CurativeStatus.RESOLVED) return;
    this.status = CurativeStatus.RESOLVED;
    this.resolutionNotes = notes ?? this.resolutionNotes;
    this.resolutionDate = resolutionDate
      ? new Date(resolutionDate)
      : new Date();
    this.touch();
  }

  waive(notes?: string): void {
    if (this.status === CurativeStatus.RESOLVED) {
      throw new Error('Cannot waive a resolved item');
    }
    this.status = CurativeStatus.WAIVED;
    this.resolutionNotes = notes ?? this.resolutionNotes;
    this.touch();
  }

  reassign(to: string, updatedBy: string): void {
    const previousAssignee = this.assignedTo;
    this.assignedTo = to;
    this.touch();

    // Raise domain event
    this.addDomainEvent(
      new CurativeItemAssignedEvent(this.id, to, updatedBy, previousAssignee),
    );
  }

  setDueDate(date: Date | undefined, updatedBy: string): void {
    const previousDueDate = this.dueDate;
    this.dueDate = date ? new Date(date) : undefined;
    this.touch();

    // Raise domain event
    this.addDomainEvent(
      new CurativeItemDueDateChangedEvent(
        this.id,
        updatedBy,
        previousDueDate,
        date,
      ),
    );
  }

  private touch(): void {
    this.updatedAt = new Date();
    this.version++;
  }

  private addDomainEvent(event: IEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): IEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
