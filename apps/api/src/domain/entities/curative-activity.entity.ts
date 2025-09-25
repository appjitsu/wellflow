export enum ActionType {
  NOTE = 'note',
  ASSIGNED = 'assigned',
  STATUS_CHANGE = 'status_change',
  DOC_UPLOADED = 'doc_uploaded',
  EMAIL = 'email',
  CALL = 'call',
  FILED = 'filed',
  PREPARED = 'prepared',
}

export interface CurativeActivityProps {
  id: string;
  curativeItemId: string;
  actionType: ActionType;
  actionBy?: string;
  actionDate?: Date;
  details?: string;
  previousStatus?: string;
  newStatus?: string;
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * CurativeActivity Entity - Tracks all actions and changes to curative items
 */
export class CurativeActivity {
  private id: string;
  private curativeItemId: string;
  private actionType: ActionType;
  private actionBy?: string;
  private actionDate: Date;
  private details?: string;
  private previousStatus?: string;
  private newStatus?: string;
  private dueDate?: Date;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(props: CurativeActivityProps) {
    this.id = props.id;
    this.curativeItemId = props.curativeItemId;
    this.actionType = props.actionType;
    this.actionBy = props.actionBy;
    this.actionDate = props.actionDate ?? new Date();
    this.details = props.details;
    this.previousStatus = props.previousStatus;
    this.newStatus = props.newStatus;
    this.dueDate = props.dueDate ? new Date(props.dueDate) : undefined;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getCurativeItemId(): string {
    return this.curativeItemId;
  }
  getActionType(): ActionType {
    return this.actionType;
  }
  getActionBy(): string | undefined {
    return this.actionBy;
  }
  getActionDate(): Date {
    return new Date(this.actionDate);
  }
  getDetails(): string | undefined {
    return this.details;
  }
  getPreviousStatus(): string | undefined {
    return this.previousStatus;
  }
  getNewStatus(): string | undefined {
    return this.newStatus;
  }
  getDueDate(): Date | undefined {
    return this.dueDate ? new Date(this.dueDate) : undefined;
  }
}
