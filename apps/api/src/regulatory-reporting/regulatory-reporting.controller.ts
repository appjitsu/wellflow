import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Res,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CheckAbilities } from '../authorization/abilities.decorator';
import { GenerateRegulatoryReportCommand } from './application/commands/generate-regulatory-report.command';
import { SubmitRegulatoryReportCommand } from './application/commands/submit-regulatory-report.command';
import { ValidateRegulatoryReportCommand } from './application/commands/validate-regulatory-report.command';
import { GetRegulatoryReportStatusQuery } from './application/queries/get-regulatory-report-status.query';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GenerateRegulatoryReportRequestDto } from './application/dtos/generate-regulatory-report.dto';
import { AbilitiesGuard } from '../authorization/abilities.guard';
import { TenantGuard } from '../common/tenant/tenant.guard';
import type { Request } from 'express';
import type { ReportInstanceRepository } from './domain/repositories/report-instance.repository';
import type { RegulatoryReportFormData } from './domain/value-objects/regulatory-report-form-data';
import type { SubmissionReceipt } from './infrastructure/adapters/regulator-adapter.interface';

interface AuthUser {
  id: string;
  organizationId?: string;
  email?: string;
}

@ApiTags('Compliance')
@ApiBearerAuth()
@UseGuards(TenantGuard, AbilitiesGuard)
@Controller('compliance/reports')
export class RegulatoryReportingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject('ReportInstanceRepository')
    private readonly reportRepo: ReportInstanceRepository,
  ) {}

  @Post('generate')
  @CheckAbilities({ action: 'create', subject: 'Well' })
  @ApiOperation({ summary: 'Generate a regulatory report instance (TX PR)' })
  @ApiBody({ type: GenerateRegulatoryReportRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Report generated',
    content: {
      'application/json': {
        example: { reportId: 'rep_1234567890' },
      },
    },
  })
  async generate(
    @Body() dto: GenerateRegulatoryReportRequestDto,
    @Req() req: Request & { user: AuthUser },
  ): Promise<{ reportId: string }> {
    const id = await this.commandBus.execute<
      GenerateRegulatoryReportCommand,
      string
    >(
      new GenerateRegulatoryReportCommand(
        dto.organizationId,
        dto.jurisdiction,
        dto.reportType,
        dto.period,
        req.user.id,
      ),
    );
    return { reportId: id };
  }

  @Post(':id/validate')
  @CheckAbilities({ action: 'update', subject: 'Well' })
  @ApiOperation({ summary: 'Validate a generated report' })
  @ApiResponse({
    status: 200,
    description: 'Validation succeeded',
    content: {
      'application/json': {
        example: { success: true },
      },
    },
  })
  async validate(@Param('id') reportId: string): Promise<{ success: true }> {
    await this.commandBus.execute(
      new ValidateRegulatoryReportCommand(reportId),
    );
    return { success: true };
  }

  @Post(':id/submit')
  @CheckAbilities({ action: 'submitReport', subject: 'Well' })
  @ApiOperation({ summary: 'Submit a validated report to the regulator' })
  @ApiBody({
    description: 'Optional submission options (e.g., corrected/amended)',
    schema: {
      type: 'object',
      properties: {
        amendmentType: {
          type: 'string',
          enum: ['ORIGINAL', 'CORRECTED', 'AMENDED'],
          default: 'ORIGINAL',
          example: 'ORIGINAL',
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Submission accepted',
    content: {
      'application/json': {
        example: { submissionId: 'tx-pr-fixedwidth', accepted: true },
      },
    },
  })
  async submit(
    @Param('id') reportId: string,
    @Body() body?: { amendmentType?: 'ORIGINAL' | 'CORRECTED' | 'AMENDED' },
  ): Promise<SubmissionReceipt> {
    return this.commandBus.execute<
      SubmitRegulatoryReportCommand,
      SubmissionReceipt
    >(
      new SubmitRegulatoryReportCommand(
        reportId,
        body?.amendmentType ?? 'ORIGINAL',
      ),
    );
  }
  @Get(':id/export')
  @CheckAbilities({ action: 'read', subject: 'Well' })
  @ApiOperation({ summary: 'Download the generated TX PR file for upload' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiProduces('text/plain')
  @ApiResponse({
    status: 200,
    description: 'Fixed-width TX PR file',
    content: {
      'text/plain': {
        example:
          'HDRTXPRorg-1       202408\nPRD42123123456789OILBBL000000010000\nPRD42123123456789GASMCF000000020000\nTRL000001\n',
      },
    },
  })
  async export(
    @Param('id') reportId: string,
    @Res() res: import('express').Response,
  ) {
    const formData: RegulatoryReportFormData | null =
      await this.reportRepo.getFormData(reportId);
    const tx = formData?.txPrExport;
    if (!tx?.bytesBase64) {
      throw new NotFoundException(
        'Export not found. Generate and validate first.',
      );
    }
    const bytes = Buffer.from(tx.bytesBase64, 'base64');
    const period = tx.period?.replace('-', '') ?? 'YYYYMM';
    const filename = `TX_PR_${period}.txt`;
    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(bytes);
  }

  @Get(':id/status')
  @CheckAbilities({ action: 'read', subject: 'Well' })
  @ApiOperation({ summary: 'Get status of a report' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  async status(@Param('id') reportId: string): Promise<{ status: string }> {
    return this.queryBus.execute<
      GetRegulatoryReportStatusQuery,
      { status: string }
    >(new GetRegulatoryReportStatusQuery(reportId));
  }
}
