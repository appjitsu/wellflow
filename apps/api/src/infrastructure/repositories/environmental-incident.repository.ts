import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, inArray, gte, lte } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { environmentalIncidents } from '../../database/schema';
import {
  EnvironmentalIncident,
  RemediationAction,
} from '../../domain/entities/environmental-incident.entity';
import {
  EnvironmentalIncidentFilters,
  EnvironmentalIncidentRepository,
} from '../../domain/repositories/environmental-incident.repository.interface';
import {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  VolumeUnit,
} from '../../domain/enums/environmental-incident.enums';

@Injectable()
export class DrizzleEnvironmentalIncidentRepository
  implements EnvironmentalIncidentRepository
{
  constructor(private readonly dbService: DatabaseService) {}

  async save(incident: EnvironmentalIncident): Promise<void> {
    const db = this.dbService.getDb();
    // Upsert by id
    const now = new Date();
    await db
      .insert(environmentalIncidents)
      .values(this.toRow(incident))
      .onConflictDoUpdate({
        target: environmentalIncidents.id,
        set: { ...this.toRow(incident), updatedAt: now },
      });
  }

  async findById(id: string): Promise<EnvironmentalIncident | null> {
    const db = this.dbService.getDb();
    const [row] = await db
      .select()
      .from(environmentalIncidents)
      .where(eq(environmentalIncidents.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async list(
    filters: EnvironmentalIncidentFilters,
  ): Promise<{ items: EnvironmentalIncident[]; total: number }> {
    const db = this.dbService.getDb();
    const where = and(
      eq(environmentalIncidents.organizationId, filters.organizationId),
      filters.incidentType?.length
        ? inArray(
            environmentalIncidents.incidentType,
            filters.incidentType.map((t) => t as string),
          )
        : undefined,
      filters.severity?.length
        ? inArray(
            environmentalIncidents.severity,
            filters.severity.map((s) => s as string),
          )
        : undefined,
      filters.status?.length
        ? inArray(
            environmentalIncidents.status,
            filters.status.map((st) => st as string),
          )
        : undefined,
      filters.wellId
        ? eq(environmentalIncidents.wellId, filters.wellId)
        : undefined,
      filters.fromDate
        ? gte(
            environmentalIncidents.incidentDate,
            filters.fromDate.toISOString().slice(0, 10),
          )
        : undefined,
      filters.toDate
        ? lte(
            environmentalIncidents.incidentDate,
            filters.toDate.toISOString().slice(0, 10),
          )
        : undefined,
      typeof filters.regulatoryNotified === 'boolean'
        ? eq(
            environmentalIncidents.regulatoryNotification,
            filters.regulatoryNotified,
          )
        : undefined,
      filters.search
        ? ilike(environmentalIncidents.description, `%${filters.search}%`)
        : undefined,
    );

    const limit = filters.limit ?? 25;
    const offset = filters.offset ?? 0;

    const rowsPromise = db
      .select()
      .from(environmentalIncidents)
      .where(where)
      .orderBy(
        desc(environmentalIncidents.incidentDate),
        desc(environmentalIncidents.createdAt),
      )
      .limit(limit)
      .offset(offset);

    const totalResultPromise = db
      .select({ total: count() })
      .from(environmentalIncidents)
      .where(where);

    const [rows, totalResult] = await Promise.all([
      rowsPromise,
      totalResultPromise,
    ]);
    const total = (totalResult[0]?.total as number) ?? 0;

    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  private toDomain(
    row: typeof environmentalIncidents.$inferSelect,
  ): EnvironmentalIncident {
    return new EnvironmentalIncident({
      id: row.id,
      organizationId: row.organizationId,
      reportedByUserId: row.reportedByUserId,
      incidentNumber: row.incidentNumber,
      incidentType: row.incidentType as IncidentType,
      incidentDate: new Date(row.incidentDate),
      discoveryDate: new Date(row.discoveryDate),
      location: row.location,
      description: row.description,
      severity: row.severity as IncidentSeverity,
      wellId: row.wellId ?? undefined,
      causeAnalysis: row.causeAnalysis ?? undefined,
      substanceInvolved: row.substanceInvolved ?? undefined,
      estimatedVolume: row.estimatedVolume
        ? Number(row.estimatedVolume)
        : undefined,
      volumeUnit: (row.volumeUnit ?? undefined) as VolumeUnit | undefined,
    });
  }

  private toRow(
    entity: EnvironmentalIncident,
  ): typeof environmentalIncidents.$inferInsert {
    const e = entity.toPrimitives() as {
      id: string;
      organizationId: string;
      reportedByUserId: string;
      incidentNumber: string;
      incidentType: IncidentType;
      incidentDate: Date;
      discoveryDate: Date;
      wellId?: string;
      location: string;
      description: string;
      causeAnalysis?: string;
      substanceInvolved?: string;
      estimatedVolume?: number;
      volumeUnit?: VolumeUnit;
      severity: IncidentSeverity;
      status: IncidentStatus;
      regulatoryNotification: boolean;
      notificationDate?: Date;
      remediationActions: RemediationAction[];
      closureDate?: Date;
      createdAt: Date;
      updatedAt: Date;
    };
    return {
      id: e.id,
      organizationId: e.organizationId,
      reportedByUserId: e.reportedByUserId,
      incidentNumber: e.incidentNumber,
      incidentType: e.incidentType,
      incidentDate: e.incidentDate.toISOString().slice(0, 10),
      discoveryDate: e.discoveryDate.toISOString().slice(0, 10),
      wellId: e.wellId,
      location: e.location,
      description: e.description,
      causeAnalysis: e.causeAnalysis,
      substanceInvolved: e.substanceInvolved,
      estimatedVolume:
        e.estimatedVolume !== undefined ? String(e.estimatedVolume) : undefined,
      volumeUnit: e.volumeUnit,
      severity: e.severity as string,
      status: e.status as string,
      regulatoryNotification: e.regulatoryNotification,
      notificationDate: e.notificationDate
        ? e.notificationDate.toISOString().slice(0, 10)
        : undefined,
      remediationActions: (e.remediationActions ?? []) as unknown,
      closureDate: e.closureDate
        ? e.closureDate.toISOString().slice(0, 10)
        : undefined,
      createdAt: e.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
  }
}
