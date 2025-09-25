import { DailyDrillingReport } from '../entities/daily-drilling-report.entity';

export interface IDailyDrillingReportRepository {
  save(ddr: DailyDrillingReport): Promise<DailyDrillingReport>;
  findById(id: string): Promise<DailyDrillingReport | null>;
  findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      wellId?: string;
      fromDate?: Date;
      toDate?: Date;
    },
  ): Promise<DailyDrillingReport[]>;
}
