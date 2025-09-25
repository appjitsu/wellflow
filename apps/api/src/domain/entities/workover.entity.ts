import { IEvent } from '@nestjs/cqrs';
import { WorkoverStatus } from '../enums/workover-status.enum';

export interface WorkoverPersistence {
  id: string;
  organizationId: string;
  wellId: string;
  afeId?: string | null;
  reason?: string | null;
  status: WorkoverStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  estimatedCost?: string | null;
  actualCost?: string | null;
  preProductionSnapshot?: Record<string, unknown> | null;
  postProductionSnapshot?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Workover {
  private readonly id: string;
  private readonly organizationId: string;
  private readonly wellId: string;
  private readonly afeId?: string;
  private reason?: string;
  private status: WorkoverStatus;
  private startDate?: Date;
  private endDate?: Date;
  private estimatedCost?: string;
  private actualCost?: string;
  private preProductionSnapshot?: Record<string, unknown>;
  private postProductionSnapshot?: Record<string, unknown>;
  private createdAt: Date;
  private updatedAt: Date;
  private domainEvents: IEvent[] = [];

  constructor(props: {
    id: string;
    organizationId: string;
    wellId: string;
    status?: WorkoverStatus;
    afeId?: string;
    reason?: string;
    startDate?: Date;
    endDate?: Date;
    estimatedCost?: string;
    actualCost?: string;
    preProductionSnapshot?: Record<string, unknown>;
    postProductionSnapshot?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.wellId = props.wellId;
    this.afeId = props.afeId;
    this.reason = props.reason;
    this.status = props.status ?? WorkoverStatus.PLANNED;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.estimatedCost = props.estimatedCost;
    this.actualCost = props.actualCost;
    this.preProductionSnapshot = props.preProductionSnapshot;
    this.postProductionSnapshot = props.postProductionSnapshot;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  getId(): string {
    return this.id;
  }
  getOrganizationId(): string {
    return this.organizationId;
  }
  getWellId(): string {
    return this.wellId;
  }
  getAfeId(): string | undefined {
    return this.afeId;
  }
  getReason(): string | undefined {
    return this.reason;
  }
  getStatus(): WorkoverStatus {
    return this.status;
  }
  getStartDate(): Date | undefined {
    return this.startDate;
  }
  getEndDate(): Date | undefined {
    return this.endDate;
  }
  getEstimatedCost(): string | undefined {
    return this.estimatedCost;
  }
  getActualCost(): string | undefined {
    return this.actualCost;
  }
  getPreProductionSnapshot(): Record<string, unknown> | undefined {
    return this.preProductionSnapshot;
  }
  getPostProductionSnapshot(): Record<string, unknown> | undefined {
    return this.postProductionSnapshot;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  static fromPersistence(data: WorkoverPersistence): Workover {
    return new Workover({
      id: data.id,
      organizationId: data.organizationId,
      wellId: data.wellId,
      afeId: data.afeId ?? undefined,
      reason: data.reason ?? undefined,
      status: data.status,
      startDate: data.startDate ?? undefined,
      endDate: data.endDate ?? undefined,
      estimatedCost: data.estimatedCost ?? undefined,
      actualCost: data.actualCost ?? undefined,
      preProductionSnapshot: data.preProductionSnapshot ?? undefined,
      postProductionSnapshot: data.postProductionSnapshot ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  toPersistence(): WorkoverPersistence {
    return {
      id: this.id,
      organizationId: this.organizationId,
      wellId: this.wellId,
      afeId: this.afeId ?? null,
      reason: this.reason ?? null,
      status: this.status,
      startDate: this.startDate ?? null,
      endDate: this.endDate ?? null,
      estimatedCost: this.estimatedCost ?? null,
      actualCost: this.actualCost ?? null,
      preProductionSnapshot: this.preProductionSnapshot ?? null,
      postProductionSnapshot: this.postProductionSnapshot ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  getDomainEvents(): IEvent[] {
    return [...this.domainEvents];
  }
  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
