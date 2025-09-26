import { IEvent } from '@nestjs/cqrs';
import { ApiNumber } from '../value-objects/api-number';
import { Location } from '../value-objects/location';
import { Coordinates } from '../value-objects/coordinates';
import { WellStatus, WellType } from '../enums/well-status.enum';
import { WellStatusChangedEvent } from '../events/well-status-changed.event';

interface WellPersistenceData {
  id: string;
  apiNumber: string;
  name: string;
  operatorId: string;
  wellType: WellType;
  location: {
    coordinates: unknown;
    address?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  status: WellStatus;
  spudDate?: Date;
  completionDate?: Date;
  totalDepth?: number;
  leaseId?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * Well Entity - Aggregate Root
 * Represents an oil & gas well with its complete lifecycle
 */
export class Well {
  private id: string;
  private apiNumber: ApiNumber;
  private name: string;
  private operatorId: string;
  private leaseId?: string;
  private wellType: WellType;
  private status: WellStatus;
  private location: Location;
  private spudDate?: Date;
  private completionDate?: Date;
  private totalDepth?: number;
  private createdAt: Date;
  private updatedAt: Date;
  private version: number;

  // Domain events
  private domainEvents: IEvent[] = [];

  constructor(
    id: string,
    apiNumber: ApiNumber,
    name: string,
    operatorId: string,
    wellType: WellType,
    location: Location,
    options?: {
      leaseId?: string;
      status?: WellStatus;
      spudDate?: Date;
      completionDate?: Date;
      totalDepth?: number;
    },
  ) {
    this.id = id;
    this.apiNumber = apiNumber;
    this.name = name;
    this.operatorId = operatorId;
    this.wellType = wellType;
    this.location = location;
    this.leaseId = options?.leaseId;
    this.status = options?.status || WellStatus.DRILLING;
    this.spudDate = options?.spudDate;
    this.completionDate = options?.completionDate;
    this.totalDepth = options?.totalDepth;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;
  }

  // Getters
  getId(): { getValue(): string } {
    return {
      getValue: () => this.id,
    };
  }

  getApiNumber(): ApiNumber {
    return this.apiNumber;
  }

  getName(): string {
    return this.name;
  }

  getOperatorId(): string {
    return this.operatorId;
  }

  getLeaseId(): string | undefined {
    return this.leaseId;
  }

  getWellType(): WellType {
    return this.wellType;
  }

  getStatus(): WellStatus {
    return this.status;
  }

  getLocation(): Location {
    return this.location;
  }

  getSpudDate(): Date | undefined {
    return this.spudDate;
  }

  getCompletionDate(): Date | undefined {
    return this.completionDate;
  }

  getTotalDepth(): number | undefined {
    return this.totalDepth;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getVersion(): number {
    return this.version;
  }

  incrementVersion(): void {
    this.version++;
  }

  // Business methods
  updateStatus(newStatus: WellStatus, updatedBy: string): void {
    if (!this.isValidStatusTransition(this.status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${this.status} to ${newStatus}`,
      );
    }

    const previousStatus = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();
    this.version++;

    // Raise domain event
    this.addDomainEvent(
      new WellStatusChangedEvent(
        this.id,
        this.apiNumber.getValue(),
        previousStatus,
        newStatus,
        updatedBy,
      ),
    );
  }

  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Well name cannot be empty');
    }

    this.name = newName.trim();
    this.updatedAt = new Date();
    this.version++;
  }

  setSpudDate(spudDate: Date): void {
    if (spudDate > new Date()) {
      throw new Error('Spud date cannot be in the future');
    }

    this.spudDate = spudDate;
    this.updatedAt = new Date();
    this.version++;
  }

  setCompletionDate(completionDate: Date): void {
    if (this.spudDate && completionDate < this.spudDate) {
      throw new Error('Completion date cannot be before spud date');
    }

    this.completionDate = completionDate;
    this.updatedAt = new Date();
    this.version++;
  }

  setTotalDepth(totalDepth: number): void {
    if (totalDepth <= 0) {
      throw new Error('Total depth must be greater than 0');
    }

    this.totalDepth = totalDepth;
    this.updatedAt = new Date();
    this.version++;
  }

  // Domain event management
  getDomainEvents(): IEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  private addDomainEvent(event: IEvent): void {
    this.domainEvents.push(event);
  }

  private isValidStatusTransition(from: WellStatus, to: WellStatus): boolean {
    const validTransitions: Record<WellStatus, WellStatus[]> = {
      [WellStatus.PLANNED]: [WellStatus.PERMITTED, WellStatus.DRILLING],
      [WellStatus.PERMITTED]: [WellStatus.DRILLING, WellStatus.PLANNED],
      [WellStatus.DRILLING]: [
        WellStatus.COMPLETED,
        WellStatus.TEMPORARILY_ABANDONED,
      ],
      [WellStatus.COMPLETED]: [WellStatus.PRODUCING, WellStatus.SHUT_IN],
      [WellStatus.PRODUCING]: [
        WellStatus.SHUT_IN,
        WellStatus.TEMPORARILY_ABANDONED,
      ],
      [WellStatus.SHUT_IN]: [
        WellStatus.PRODUCING,
        WellStatus.TEMPORARILY_ABANDONED,
      ],
      [WellStatus.TEMPORARILY_ABANDONED]: [
        WellStatus.PERMANENTLY_ABANDONED,
        WellStatus.PRODUCING,
      ],
      [WellStatus.PERMANENTLY_ABANDONED]: [WellStatus.PLUGGED],
      [WellStatus.PLUGGED]: [], // Terminal state
      [WellStatus.ACTIVE]: [WellStatus.INACTIVE], // Legacy status
      [WellStatus.INACTIVE]: [WellStatus.ACTIVE], // Legacy status
      [WellStatus.UNKNOWN]: Object.values(WellStatus), // Can transition to any status
    };

    // eslint-disable-next-line security/detect-object-injection
    return validTransitions[from]?.includes(to) || false;
  }

  // Factory method for reconstruction from persistence
  static fromPersistence(data: WellPersistenceData): Well {
    // Convert coordinates from plain object to Coordinates instance
    const coordinatesData = data.location.coordinates as {
      latitude: number;
      longitude: number;
    };
    const coordinates = new Coordinates(
      coordinatesData.latitude,
      coordinatesData.longitude,
    );

    const well = new Well(
      data.id,
      new ApiNumber(data.apiNumber),
      data.name,
      data.operatorId,
      data.wellType,
      new Location(coordinates, {
        address: data.location.address,
        county: data.location.county,
        state: data.location.state,
        country: data.location.country,
      }),
      {
        leaseId: data.leaseId,
        status: data.status,
        spudDate: data.spudDate,
        completionDate: data.completionDate,
        totalDepth: data.totalDepth,
      },
    );

    // Set persistence fields
    well.createdAt = data.createdAt;
    well.updatedAt = data.updatedAt;
    well.version = data.version;

    return well;
  }
}
