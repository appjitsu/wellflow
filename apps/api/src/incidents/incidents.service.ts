import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EnvironmentalIncident } from '../domain/entities/environmental-incident.entity';
import {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from '../domain/enums/environmental-incident.enums';
import type {
  EnvironmentalIncidentRepository,
  EnvironmentalIncidentFilters,
} from '../domain/repositories/environmental-incident.repository.interface';

@Injectable()
export class IncidentsService {
  constructor(
    @Inject('EnvironmentalIncidentRepository')
    private readonly incidentsRepo: EnvironmentalIncidentRepository,
  ) {}

  async createIncident(input: {
    organizationId: string;
    reportedByUserId: string;
    incidentNumber: string;
    incidentType: IncidentType;
    incidentDate: Date;
    discoveryDate: Date;
    location: string;
    description: string;
    severity: IncidentSeverity;
    wellId?: string;
    causeAnalysis?: string;
    substanceInvolved?: string;
    estimatedVolume?: number;
    volumeUnit?: 'barrels' | 'gallons' | 'cubic_feet';
  }): Promise<{ id: string }> {
    const id = randomUUID();
    const incident = new EnvironmentalIncident({ id, ...input });
    await this.incidentsRepo.save(incident);
    return { id };
  }

  async getIncidentById(id: string): Promise<EnvironmentalIncident> {
    const incident = await this.incidentsRepo.findById(id);
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async listIncidents(filters: EnvironmentalIncidentFilters) {
    return this.incidentsRepo.list(filters);
  }

  async updateIncidentStatus(
    id: string,
    status: IncidentStatus,
    reason?: string,
  ): Promise<{ id: string; status: IncidentStatus }> {
    const incident = await this.incidentsRepo.findById(id);
    if (!incident) throw new NotFoundException('Incident not found');
    // Stub: invoke domain change and persist via upsert, without extra business logic here
    incident.changeStatus(status, reason);
    await this.incidentsRepo.save(incident);
    return { id, status };
  }
}
