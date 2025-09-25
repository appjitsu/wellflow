import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { dailyDrillingReports } from '../../database/schemas/daily-drilling-reports';
import { DailyDrillingReport } from '../../domain/entities/daily-drilling-report.entity';
import type { IDailyDrillingReportRepository } from '../../domain/repositories/daily-drilling-report.repository.interface';

export class DailyDrillingReportRepository
  implements IDailyDrillingReportRepository
{
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async save(entity: DailyDrillingReport): Promise<DailyDrillingReport> {
    const values: typeof dailyDrillingReports.$inferInsert = {
      id: entity.getId(),
      organizationId: entity.getOrganizationId(),
      wellId: entity.getWellId(),
      reportDate: entity.getReportDate().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.db
      .insert(dailyDrillingReports)
      .values(values)
      .onConflictDoUpdate({
        target: dailyDrillingReports.id,
        set: { ...values, updatedAt: new Date() },
      });
    return entity;
  }

  async findById(id: string): Promise<DailyDrillingReport | null> {
    const [row] = await this.db
      .select()
      .from(dailyDrillingReports)
      .where(eq(dailyDrillingReports.id, id))
      .limit(1);
    if (!row) return null;
    return new DailyDrillingReport({
      id: row.id,
      organizationId: row.organizationId,
      wellId: row.wellId,
      reportDate: new Date(row.reportDate),
    });
  }

  async findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      wellId?: string;
      fromDate?: Date;
      toDate?: Date;
    },
  ): Promise<DailyDrillingReport[]> {
    const clauses = [eq(dailyDrillingReports.organizationId, organizationId)];
    if (options?.wellId)
      clauses.push(eq(dailyDrillingReports.wellId, options.wellId));
    if (options?.fromDate) {
      const fromStr = options.fromDate.toISOString().slice(0, 10);
      clauses.push(gte(dailyDrillingReports.reportDate, fromStr));
    }
    if (options?.toDate) {
      const toStr = options.toDate.toISOString().slice(0, 10);
      clauses.push(lte(dailyDrillingReports.reportDate, toStr));
    }

    const rows = await this.db
      .select()
      .from(dailyDrillingReports)
      .where(and(...clauses))
      .orderBy(desc(dailyDrillingReports.reportDate))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0);

    return rows.map(
      (r) =>
        new DailyDrillingReport({
          id: r.id,
          organizationId: r.organizationId,
          wellId: r.wellId,
          reportDate: new Date(r.reportDate),
        }),
    );
  }
}
