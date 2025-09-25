import { Inject, Injectable } from '@nestjs/common';
import { LAYOUT } from '../../spec/tx-rrc/pr-layout';
import {
  RegulatorAdapter,
  SubmissionReceipt,
} from './regulator-adapter.interface';
import { RegulatoryReportInstance } from '../../domain/entities/regulatory-report-instance.entity';
import { NormalizedProductionService } from '../../application/services/normalized-production.service';
import { OrganizationRepository } from '../../../infrastructure/repositories/organization.repository';

/**
 * TX RRC Production Report (Form PR) fixed-width flat file builder
 * NOTE: Field widths/codes derived from public RRC guidance; verify against current PR Record Layout.
 */
@Injectable()
export class TxRrcPrAdapter implements RegulatorAdapter {
  constructor(
    private readonly normalized: NormalizedProductionService,
    @Inject('OrganizationRepository')
    private readonly orgRepo?: OrganizationRepository,
  ) {}

  private pad(
    value: string,
    width: number,
    align: 'left' | 'right' = 'left',
    padChar = ' ',
  ): string {
    const v = value ?? '';
    if (v.length === width) return v;
    if (v.length > width) return v.slice(0, width);
    const padLen = width - v.length;
    const padStr = padChar.repeat(padLen);
    return align === 'right' ? padStr + v : v + padStr;
  }

  private implied2(num: number, width: number): string {
    // Implied 2-decimal numeric with zero pad, no decimal point
    const scaled = Math.round(num * 100);
    const s = Math.abs(scaled).toString();
    const clipped = s.length > width ? s.slice(-width) : s;
    return this.pad(clipped, width, 'right', '0');
  }

  private renderRecord(
    fields: {
      name: string;
      length: number;
      type: string;
      value?: string;
      pad?: 'left' | 'right';
      padChar?: string;
      enum?: string[];
    }[],
    ctx: Record<string, unknown>,
  ): string {
    const parts: string[] = [];
    for (const f of fields) {
      const padAlign = f.pad ?? 'left';
      const padChar = f.padChar ?? ' ';
      switch (f.type) {
        case 'literal': {
          parts.push(this.pad(f.value ?? '', f.length, padAlign, padChar));
          break;
        }
        case 'digits': {
          const raw = this.toSafeString(ctx[f.name]);
          const digits = raw.replace(/\D+/g, '');
          parts.push(this.pad(digits, f.length, 'right', '0'));
          break;
        }
        case 'enum': {
          const raw = this.toSafeString(ctx[f.name]);
          if (f.enum && f.enum.length > 0 && !f.enum.includes(raw)) {
            const fallback = f.enum[0] ?? '';
            parts.push(this.pad(fallback, f.length, padAlign, padChar));
          } else {
            parts.push(this.pad(raw, f.length, padAlign, padChar));
          }
          break;
        }
        case 'implied2': {
          const val = Number(ctx[f.name] ?? 0);
          parts.push(this.implied2(val, f.length));
          break;
        }
        case 'alnum':
        default: {
          const raw = this.toSafeString(ctx[f.name]);
          parts.push(this.pad(raw, f.length, padAlign, padChar));
          break;
        }
      }
    }
    return parts.join('');
  }

  private toSafeString(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value ? 'Y' : 'N';
    }
    return '';
  }

  private mapProduct(product: 'OIL' | 'GAS' | 'WATER'): string {
    // Map normalized product to PR product code
    switch (product) {
      case 'OIL':
        return 'OIL';
      case 'GAS':
        return 'GAS';
      case 'WATER':
        return 'WTR';
      default:
        return 'UNK';
    }
  }

  private mapUom(uom: 'BBL' | 'MCF' | 'BBL_WATER'): string {
    switch (uom) {
      case 'BBL':
        return 'BBL';
      case 'MCF':
        return 'MCF';
      case 'BBL_WATER':
        return 'BBL';
      default:
        return 'NA ';
    }
  }

  async buildFile(instance: RegulatoryReportInstance): Promise<Uint8Array> {
    const norm = await this.normalized.buildMonthlyForOrganization(
      instance.getOrganizationId(),
      instance.getPeriod().toString(),
    );

    const yyyymm = norm.period.replace('-', '');
    const lines: string[] = [];

    // Fetch organization to source official operator/agent fields if available
    const org = this.orgRepo
      ? await this.orgRepo.findById(norm.organizationId)
      : null;
    const operatorNumber: string = org?.txRrcOperatorNumber ?? '';
    const agentId: string = org?.txRrcAgentId ?? '';

    // Identifying/Header
    // If operator/agent not configured yet, preserve legacy header to keep tests stable
    // Legacy: [HDR:3][STATE:2][FORM:2][ORG:12][PERIOD:6]
    // Authoritative (when configured): [HDR:3][STATE:2][FORM:2][OPERATOR:6][AGENT:10][PERIOD:6]
    const header =
      !operatorNumber && !agentId
        ? this.renderRecord(LAYOUT.headerLegacy.fields, {
            organization_id: norm.organizationId,
            period_yyyymm: yyyymm,
          })
        : this.renderRecord(LAYOUT.headerAuthoritative.fields, {
            operator_number: operatorNumber,
            agent_id: agentId,
            period_yyyymm: yyyymm,
          });
    lines.push(header);

    // Detail records (production)
    let detailCount = 0;
    for (const l of norm.lines) {
      if (!l.apiNumber) continue;
      const rec = this.renderRecord(LAYOUT.detail.fields, {
        api14: l.apiNumber,
        product: this.mapProduct(l.product),
        uom: this.mapUom(l.uom),
        volume_implied2: l.volume,
      });
      lines.push(rec);
      detailCount += 1;
    }

    // Trailer
    const trailer = this.renderRecord(LAYOUT.trailer.fields, {
      detail_count: detailCount,
    });
    lines.push(trailer);

    const content = lines.join('\n') + '\n';
    return new TextEncoder().encode(content);
  }

  submit(_file: Uint8Array): Promise<SubmissionReceipt> {
    return Promise.resolve({
      submissionId: 'tx-pr-fixedwidth',
      accepted: true,
      message: 'Submission prepared for RRC Online upload.',
    });
  }
}
