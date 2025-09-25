import { Inject, Injectable } from '@nestjs/common';
import { NormalizedProductionDto } from '../dtos/normalized-production.dto';
import type { ProductionRepository } from '../../../infrastructure/repositories/production.repository';
import type { WellRepositoryImpl } from '../../../infrastructure/repositories/well.repository';

@Injectable()
export class NormalizedProductionService {
  constructor(
    @Inject('ProductionRepository')
    private readonly productionRepo: ProductionRepository,
    @Inject('WellRepository') private readonly wellRepo: WellRepositoryImpl,
  ) {}

  async buildMonthlyForOrganization(
    organizationId: string,
    period: string,
  ): Promise<NormalizedProductionDto> {
    const { startDate, endDate } = this.resolvePeriodRange(period);
    const records = await this.productionRepo.findByOrganizationAndDateRange(
      organizationId,
      startDate,
      endDate,
    );

    const aggregates = this.aggregateByWell(records);
    const lines = await this.buildLinesFromAggregates(aggregates);

    return { organizationId, period, lines };
  }

  private resolvePeriodRange(period: string): {
    startDate: Date;
    endDate: Date;
  } {
    const [yearStr, monthStr] = period.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    if (!Number.isInteger(year) || !Number.isInteger(monthIndex)) {
      throw new Error(`Invalid period format: ${period}`);
    }
    return {
      startDate: new Date(Date.UTC(year, monthIndex, 1)),
      endDate: new Date(Date.UTC(year, monthIndex + 1, 0)),
    };
  }

  private aggregateByWell(
    records: unknown[],
  ): Map<string, { oil: number; gas: number; water: number }> {
    const byWell = new Map<
      string,
      { oil: number; gas: number; water: number }
    >();

    for (const raw of records) {
      const record = this.normalizeRecord(raw);
      if (!record) continue;

      const next = byWell.get(record.wellId) ?? {
        oil: 0,
        gas: 0,
        water: 0,
      };

      next.oil += record.oilVolume;
      next.gas += record.gasVolume;
      next.water += record.waterVolume;
      byWell.set(record.wellId, next);
    }

    return byWell;
  }

  private normalizeRecord(raw: unknown): {
    wellId: string;
    oilVolume: number;
    gasVolume: number;
    waterVolume: number;
  } | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const record = raw as Record<string, unknown>;
    const wellId = typeof record.wellId === 'string' ? record.wellId : null;
    if (!wellId) {
      return null;
    }

    return {
      wellId,
      oilVolume: this.coerceVolume(record.oilVolume),
      gasVolume: this.coerceVolume(record.gasVolume),
      waterVolume: this.coerceVolume(record.waterVolume),
    };
  }

  private coerceVolume(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) && value > 0 ? value : 0;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    return 0;
  }

  private async buildLinesFromAggregates(
    aggregates: Map<string, { oil: number; gas: number; water: number }>,
  ): Promise<NormalizedProductionDto['lines']> {
    const lines: NormalizedProductionDto['lines'] = [];

    for (const [wellId, totals] of aggregates.entries()) {
      const apiNumber = await this.lookupApiNumber(wellId);

      if (totals.oil > 0) {
        lines.push({
          wellId,
          apiNumber,
          product: 'OIL',
          volume: totals.oil,
          uom: 'BBL',
        });
      }
      if (totals.gas > 0) {
        lines.push({
          wellId,
          apiNumber,
          product: 'GAS',
          volume: totals.gas,
          uom: 'MCF',
        });
      }
      if (totals.water > 0) {
        lines.push({
          wellId,
          apiNumber,
          product: 'WATER',
          volume: totals.water,
          uom: 'BBL_WATER',
        });
      }
    }

    return lines;
  }

  private async lookupApiNumber(wellId: string): Promise<string | undefined> {
    const well = await this.wellRepo.findById(wellId);
    return well?.getApiNumber().getValue();
  }
}
