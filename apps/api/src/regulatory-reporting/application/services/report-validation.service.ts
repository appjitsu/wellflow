import { Inject, Injectable } from '@nestjs/common';
import type { ReportInstanceRepository } from '../../domain/repositories/report-instance.repository';
import { NormalizedProductionService } from './normalized-production.service';
import type { NormalizedProductionDto } from '../dtos/normalized-production.dto';

@Injectable()
export class ReportValidationService {
  constructor(
    @Inject('ReportInstanceRepository')
    private readonly repo: ReportInstanceRepository,
    private readonly normalized: NormalizedProductionService,
  ) {}

  async validate(reportId: string): Promise<void> {
    const instance = await this.repo.findById(reportId);
    if (!instance) throw new Error('Report not found');

    this.ensurePeriodNotFuture(instance.getPeriod().toString());
    const normalized = await this.normalized.buildMonthlyForOrganization(
      instance.getOrganizationId(),
      instance.getPeriod().toString(),
    );

    this.ensureProductionLines(normalized.lines);
  }

  private ensurePeriodNotFuture(period: string): void {
    const [yearStr, monthStr] = period.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      throw new Error('Invalid reporting period format');
    }

    const periodDate = new Date(Date.UTC(year, month - 1, 1));
    const now = new Date();
    const currentMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    if (periodDate > currentMonth) {
      throw new Error('Reporting period cannot be in the future');
    }
  }

  private ensureProductionLines(lines: NormalizedProductionDto['lines']): void {
    if (lines.length === 0) {
      throw new Error('No production available for the selected period');
    }

    let total = 0;
    for (const line of lines) {
      this.ensureValidApiNumber(line.apiNumber);
      this.ensureProductUnits(line.product, line.uom);
      if (line.volume < 0) {
        throw new Error('Volumes must be non-negative');
      }
      total += line.volume;
    }

    if (total < 0) {
      throw new Error('Total volume cannot be negative');
    }
  }

  private ensureValidApiNumber(apiNumber?: string): void {
    if (!apiNumber || !/^\d{14}$/.test(apiNumber)) {
      throw new Error('All lines must have a valid 14-digit API number');
    }
  }

  private ensureProductUnits(
    product: 'OIL' | 'GAS' | 'WATER',
    uom: 'BBL' | 'MCF' | 'BBL_WATER',
  ): void {
    switch (product) {
      case 'OIL':
        if (uom !== 'BBL') throw new Error('OIL must use BBL');
        break;
      case 'GAS':
        if (uom !== 'MCF') throw new Error('GAS must use MCF');
        break;
      case 'WATER':
        if (uom !== 'BBL_WATER') throw new Error('WATER must use BBL_WATER');
        break;
      default:
        throw new Error('Unsupported product value');
    }
  }
}
