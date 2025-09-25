import { IEvent } from '@nestjs/cqrs';
import { DrillingProgramStatus } from '../enums/drilling-program-status.enum';

export interface DrillingProgramPersistence {
  id: string;
  organizationId: string;
  wellId: string;
  afeId?: string | null;
  programName: string;
  version: number;
  status: DrillingProgramStatus;
  program?: Record<string, unknown> | null;
  hazards?: Record<string, unknown> | null;
  approvals?: Array<Record<string, unknown>> | null;
  estimatedCost?: string | null;
  actualCost?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class DrillingProgram {
  private readonly id: string;
  private readonly organizationId: string;
  private readonly wellId: string;
  private readonly afeId?: string;
  private programName: string;
  private version: number;
  private status: DrillingProgramStatus;
  private program?: Record<string, unknown>;
  private hazards?: Record<string, unknown>;
  private approvals?: Array<Record<string, unknown>>;
  private estimatedCost?: string;
  private actualCost?: string;
  private createdAt: Date;
  private updatedAt: Date;
  private domainEvents: IEvent[] = [];

  constructor(props: {
    id: string;
    organizationId: string;
    wellId: string;
    programName: string;
    version?: number;
    status?: DrillingProgramStatus;
    afeId?: string;
    program?: Record<string, unknown>;
    hazards?: Record<string, unknown>;
    approvals?: Array<Record<string, unknown>>;
    estimatedCost?: string;
    actualCost?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.wellId = props.wellId;
    this.afeId = props.afeId;
    this.programName = props.programName;
    this.version = props.version ?? 1;
    this.status = props.status ?? DrillingProgramStatus.DRAFT;
    this.program = props.program;
    this.hazards = props.hazards;
    this.approvals = props.approvals;
    this.estimatedCost = props.estimatedCost;
    this.actualCost = props.actualCost;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  // getters
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
  getProgramName(): string {
    return this.programName;
  }
  getVersion(): number {
    return this.version;
  }
  getStatus(): DrillingProgramStatus {
    return this.status;
  }
  getProgram(): Record<string, unknown> | undefined {
    return this.program;
  }
  getHazards(): Record<string, unknown> | undefined {
    return this.hazards;
  }
  getApprovals(): Array<Record<string, unknown>> | undefined {
    return this.approvals;
  }
  getEstimatedCost(): string | undefined {
    return this.estimatedCost;
  }
  getActualCost(): string | undefined {
    return this.actualCost;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // persistence mapping
  static fromPersistence(data: DrillingProgramPersistence): DrillingProgram {
    return new DrillingProgram({
      id: data.id,
      organizationId: data.organizationId,
      wellId: data.wellId,
      afeId: data.afeId ?? undefined,
      programName: data.programName,
      version: data.version,
      status: data.status,
      program: data.program ?? undefined,
      hazards: data.hazards ?? undefined,
      approvals: data.approvals ?? undefined,
      estimatedCost: data.estimatedCost ?? undefined,
      actualCost: data.actualCost ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  toPersistence(): DrillingProgramPersistence {
    return {
      id: this.id,
      organizationId: this.organizationId,
      wellId: this.wellId,
      afeId: this.afeId ?? null,
      programName: this.programName,
      version: this.version,
      status: this.status,
      program: this.program ?? null,
      hazards: this.hazards ?? null,
      approvals: this.approvals ?? null,
      estimatedCost: this.estimatedCost ?? null,
      actualCost: this.actualCost ?? null,
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
