import { Injectable } from '@nestjs/common';
import { eq, and, gte, lte, desc, sum, avg, count } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { productionRecords } from '../../database/schema';

/**
 * Production Repository Implementation
 * Handles production data with advanced analytics and reporting
 */
@Injectable()
export class ProductionRepository extends BaseRepository<
  typeof productionRecords
> {
  constructor(db: any) {
    super(db, productionRecords);
  }

  /**
   * Find production records by well ID and date range
   */
  async findByWellAndDateRange(
    wellId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<(typeof productionRecords.$inferSelect)[]> {
    return this.db
      .select()
      .from(productionRecords)
      .where(
        and(
          eq(productionRecords.wellId, wellId),
          gte(productionRecords.productionDate, startDate),
          lte(productionRecords.productionDate, endDate),
        ),
      )
      .orderBy(desc(productionRecords.productionDate));
  }

  /**
   * Find production records by organization and date range
   */
  async findByOrganizationAndDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<(typeof productionRecords.$inferSelect)[]> {
    return this.db
      .select()
      .from(productionRecords)
      .where(
        and(
          eq(productionRecords.organizationId, organizationId),
          gte(productionRecords.productionDate, startDate),
          lte(productionRecords.productionDate, endDate),
        ),
      )
      .orderBy(desc(productionRecords.productionDate));
  }

  /**
   * Get production summary for a well
   */
  async getWellProductionSummary(
    wellId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalOil: number;
    totalGas: number;
    totalWater: number;
    averageOil: number;
    averageGas: number;
    averageWater: number;
    recordCount: number;
    firstProductionDate: Date | null;
    lastProductionDate: Date | null;
  }> {
    let query = this.db
      .select({
        totalOil: sum(productionRecords.oilVolume),
        totalGas: sum(productionRecords.gasVolume),
        totalWater: sum(productionRecords.waterVolume),
        averageOil: avg(productionRecords.oilVolume),
        averageGas: avg(productionRecords.gasVolume),
        averageWater: avg(productionRecords.waterVolume),
        recordCount: count(),
      })
      .from(productionRecords)
      .where(eq(productionRecords.wellId, wellId));

    if (startDate && endDate) {
      query = query.where(
        and(
          eq(productionRecords.wellId, wellId),
          gte(productionRecords.productionDate, startDate),
          lte(productionRecords.productionDate, endDate),
        ),
      );
    }

    const [summary, dateRange] = await Promise.all([
      query,
      this.db
        .select({
          firstDate: productionRecords.productionDate,
          lastDate: productionRecords.productionDate,
        })
        .from(productionRecords)
        .where(eq(productionRecords.wellId, wellId))
        .orderBy(productionRecords.productionDate)
        .limit(1)
        .union(
          this.db
            .select({
              firstDate: productionRecords.productionDate,
              lastDate: productionRecords.productionDate,
            })
            .from(productionRecords)
            .where(eq(productionRecords.wellId, wellId))
            .orderBy(desc(productionRecords.productionDate))
            .limit(1),
        ),
    ]);

    const result = summary[0];
    const dates = dateRange;

    return {
      totalOil: Number(result?.totalOil || 0),
      totalGas: Number(result?.totalGas || 0),
      totalWater: Number(result?.totalWater || 0),
      averageOil: Number(result?.averageOil || 0),
      averageGas: Number(result?.averageGas || 0),
      averageWater: Number(result?.averageWater || 0),
      recordCount: Number(result?.recordCount || 0),
      firstProductionDate: dates[0]?.firstDate || null,
      lastProductionDate: dates[1]?.lastDate || null,
    };
  }

  /**
   * Get organization production summary
   */
  async getOrganizationProductionSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalOil: number;
    totalGas: number;
    totalWater: number;
    wellCount: number;
    recordCount: number;
  }> {
    let whereConditions = [
      eq(productionRecords.organizationId, organizationId),
    ];

    if (startDate && endDate) {
      whereConditions.push(
        gte(productionRecords.productionDate, startDate),
        lte(productionRecords.productionDate, endDate),
      );
    }

    const result = await this.db
      .select({
        totalOil: sum(productionRecords.oilVolume),
        totalGas: sum(productionRecords.gasVolume),
        totalWater: sum(productionRecords.waterVolume),
        recordCount: count(),
      })
      .from(productionRecords)
      .where(and(...whereConditions));

    // Get unique well count
    const wellCountResult = await this.db
      .selectDistinct({ wellId: productionRecords.wellId })
      .from(productionRecords)
      .where(and(...whereConditions));

    const summary = result[0];

    return {
      totalOil: Number(summary?.totalOil || 0),
      totalGas: Number(summary?.totalGas || 0),
      totalWater: Number(summary?.totalWater || 0),
      wellCount: wellCountResult.length,
      recordCount: Number(summary?.recordCount || 0),
    };
  }

  /**
   * Get monthly production aggregates
   */
  async getMonthlyProduction(
    organizationId: string,
    year: number,
  ): Promise<
    Array<{
      month: number;
      totalOil: number;
      totalGas: number;
      totalWater: number;
      recordCount: number;
    }>
  > {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const result = await this.db
      .select({
        month: productionRecords.productionDate,
        totalOil: sum(productionRecords.oilVolume),
        totalGas: sum(productionRecords.gasVolume),
        totalWater: sum(productionRecords.waterVolume),
        recordCount: count(),
      })
      .from(productionRecords)
      .where(
        and(
          eq(productionRecords.organizationId, organizationId),
          gte(productionRecords.productionDate, startDate),
          lte(productionRecords.productionDate, endDate),
        ),
      )
      .groupBy(productionRecords.productionDate);

    // Group by month (this is simplified - in production you'd use date functions)
    const monthlyData: Record<number, any> = {};

    result.forEach((record) => {
      const month = new Date(record.month).getMonth() + 1;
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          totalOil: 0,
          totalGas: 0,
          totalWater: 0,
          recordCount: 0,
        };
      }

      monthlyData[month].totalOil += Number(record.totalOil || 0);
      monthlyData[month].totalGas += Number(record.totalGas || 0);
      monthlyData[month].totalWater += Number(record.totalWater || 0);
      monthlyData[month].recordCount += Number(record.recordCount || 0);
    });

    return Object.values(monthlyData);
  }

  /**
   * Find latest production record for each well
   */
  async findLatestByWells(
    wellIds: string[],
  ): Promise<(typeof productionRecords.$inferSelect)[]> {
    if (wellIds.length === 0) return [];

    // This is a simplified version - in production you'd use window functions
    const results: (typeof productionRecords.$inferSelect)[] = [];

    for (const wellId of wellIds) {
      const latest = await this.db
        .select()
        .from(productionRecords)
        .where(eq(productionRecords.wellId, wellId))
        .orderBy(desc(productionRecords.productionDate))
        .limit(1);

      if (latest[0]) {
        results.push(latest[0]);
      }
    }

    return results;
  }

  /**
   * Bulk insert production records
   */
  async bulkInsert(
    records: (typeof productionRecords.$inferInsert)[],
  ): Promise<(typeof productionRecords.$inferSelect)[]> {
    if (records.length === 0) return [];

    return this.batchCreate(records);
  }
}
