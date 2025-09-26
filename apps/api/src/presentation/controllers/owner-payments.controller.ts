import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOwnerPaymentDto } from '../dtos/owner-payments.dto';
import { CreateOwnerPaymentCommand } from '../../application/commands/create-owner-payment.command';
import { GetOwnerPaymentByIdQuery } from '../../application/queries/get-owner-payment-by-id.query';
import { CheckAbilities } from '../../authorization/abilities.decorator';
import type { OwnerPaymentProps } from '../../domain/entities/owner-payment.entity';

function assertValidOwnerPaymentPayload(
  value: unknown,
): asserts value is OwnerPaymentProps {
  if (!value || typeof value !== 'object') {
    throw new TypeError('OwnerPayment query returned invalid payload');
  }

  const candidate = value as Partial<OwnerPaymentProps>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.organizationId !== 'string' ||
    typeof candidate.partnerId !== 'string' ||
    typeof candidate.revenueDistributionId !== 'string' ||
    typeof candidate.method !== 'string' ||
    typeof candidate.status !== 'string' ||
    typeof candidate.grossAmount !== 'string' ||
    typeof candidate.netAmount !== 'string'
  ) {
    throw new TypeError('OwnerPayment payload missing required string fields');
  }
}

@ApiTags('owner-payments')
@ApiBearerAuth()
@Controller('owner-payments')
export class OwnerPaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create owner payment' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  @CheckAbilities({ action: 'create', subject: 'OwnerPayment' })
  async create(@Body() dto: CreateOwnerPaymentDto): Promise<{ id: string }> {
    const idResult: unknown = await this.commandBus.execute(
      new CreateOwnerPaymentCommand(
        dto.organizationId,
        dto.partnerId,
        dto.method,
        dto.grossAmount,
        dto.netAmount,
        dto.revenueDistributionId,
        {
          deductionsAmount: dto.deductionsAmount,
          taxWithheldAmount: dto.taxWithheldAmount,
          checkNumber: dto.checkNumber,
          achTraceNumber: dto.achTraceNumber,
          memo: dto.memo,
        },
      ),
    );
    if (typeof idResult !== 'string') {
      throw new TypeError('CreateOwnerPaymentCommand must return a string id');
    }
    return { id: idResult };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get owner payment by id' })
  @CheckAbilities({ action: 'read', subject: 'OwnerPayment' })
  async getById(@Param('id') id: string): Promise<OwnerPaymentProps> {
    const payload: unknown = await this.queryBus.execute(
      new GetOwnerPaymentByIdQuery(id),
    );
    assertValidOwnerPaymentPayload(payload);
    return payload;
  }
}
