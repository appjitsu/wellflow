import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CheckAbilities } from '../../authorization/abilities.decorator';
import { CreateCashCallDto } from '../dtos/create-cash-call.dto';
import { RecordCashCallConsentDto } from '../dtos/record-cash-call-consent.dto';
import { CreateCashCallCommand } from '../../application/commands/create-cash-call.command';
import { GetCashCallByIdQuery } from '../../application/queries/get-cash-call-by-id.query';
import { ApproveCashCallCommand } from '../../application/commands/approve-cash-call.command';
import { RecordCashCallConsentCommand } from '../../application/commands/record-cash-call-consent.command';
import type { CashCallProps } from '../../domain/entities/cash-call.entity';
import { CurrentOrganization } from '../decorators/current-organization.decorator';

function assertValidCashCallPayload(
  value: unknown,
): asserts value is CashCallProps {
  if (!value || typeof value !== 'object') {
    throw new TypeError('CashCall query returned invalid payload');
  }

  const candidate = value as Partial<CashCallProps>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.organizationId !== 'string' ||
    typeof candidate.leaseId !== 'string' ||
    typeof candidate.partnerId !== 'string' ||
    typeof candidate.billingMonth !== 'string' ||
    typeof candidate.amount !== 'string' ||
    typeof candidate.type !== 'string' ||
    typeof candidate.status !== 'string'
  ) {
    throw new TypeError('CashCall payload missing required string fields');
  }
}

@ApiTags('CashCalls')
@Controller('cash-calls')
export class CashCallsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a cash call' })
  @CheckAbilities({ action: 'create', subject: 'CashCall' })
  async create(@Body() dto: CreateCashCallDto): Promise<{ id: string }> {
    const idResult: unknown = await this.commandBus.execute(
      new CreateCashCallCommand(
        dto.organizationId,
        dto.leaseId,
        dto.partnerId,
        dto.billingMonth,
        dto.amount,
        dto.type,
        {
          dueDate: dto.dueDate ?? null,
          interestRatePercent: dto.interestRatePercent ?? null,
          consentRequired: dto.consentRequired ?? false,
        },
      ),
    );
    if (typeof idResult !== 'string') {
      throw new TypeError('CreateCashCallCommand must return a string id');
    }
    return { id: idResult };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cash call by id' })
  @CheckAbilities({ action: 'read', subject: 'CashCall' })
  async getById(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ): Promise<CashCallProps> {
    const payload: unknown = await this.queryBus.execute(
      new GetCashCallByIdQuery(organizationId, id),
    );
    assertValidCashCallPayload(payload);
    return payload;
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve a cash call' })
  @CheckAbilities({ action: 'update', subject: 'CashCall' })
  async approve(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ): Promise<{ id: string }> {
    const resId: unknown = await this.commandBus.execute(
      new ApproveCashCallCommand(organizationId, id),
    );
    if (typeof resId !== 'string') {
      throw new TypeError('ApproveCashCallCommand must return a string id');
    }
    return { id: resId };
  }

  @Put(':id/consent')
  @ApiOperation({ summary: 'Record partner consent for a cash call' })
  @CheckAbilities({ action: 'update', subject: 'CashCall' })
  async recordConsent(
    @Param('id') id: string,
    @Body() dto: RecordCashCallConsentDto,
  ): Promise<{ id: string }> {
    const resId: unknown = await this.commandBus.execute(
      new RecordCashCallConsentCommand(
        dto.organizationId,
        id,
        dto.status,
        dto.receivedAt ?? null,
      ),
    );
    if (typeof resId !== 'string') {
      throw new TypeError(
        'RecordCashCallConsentCommand must return a string id',
      );
    }
    return { id: resId };
  }
}
