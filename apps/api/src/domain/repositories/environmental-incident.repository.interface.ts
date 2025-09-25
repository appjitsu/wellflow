import { EnvironmentalIncident } from '../entities/environmental-incident.entity';
import {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from '../enums/environmental-incident.enums';

export interface EnvironmentalIncidentFilters {
  organizationId: string;
  incidentType?: IncidentType[];
  severity?: IncidentSeverity[];
  status?: IncidentStatus[];
  wellId?: string;
  fromDate?: Date;
  toDate?: Date;
  regulatoryNotified?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface EnvironmentalIncidentRepository {
  save(incident: EnvironmentalIncident): Promise<void>;
  findById(id: string): Promise<EnvironmentalIncident | null>;
  list(
    filters: EnvironmentalIncidentFilters,
  ): Promise<{ items: EnvironmentalIncident[]; total: number }>;
}
