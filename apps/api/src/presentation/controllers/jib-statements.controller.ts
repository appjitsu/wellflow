import { Body, Controller, Param, Put, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateJibLinkDto } from '../dtos/update-jib-link.dto';
import { CreateJibStatementDto } from '../dtos/create-jib-statement.dto';
import { CheckAbilities } from '../../authorization/abilities.decorator';
import { UpdateJibLinkCashCallCommand } from '../../application/commands/update-jib-link-cash-call.command';
import { CreateJibStatementCommand } from '../../application/commands/create-jib-statement.command';

type LinkResult = {
  jibId: string;
  cashCallId: string | null;
  interestAccrued: string;
};

function assertValidLinkResult(value: unknown): asserts value is LinkResult {
  if (!value || typeof value !== 'object') {
    throw new TypeError('UpdateJibLinkCashCallCommand returned invalid data');
  }

  const candidate = value as Partial<LinkResult>;
  if (
    typeof candidate.jibId !== 'string' ||
    (candidate.cashCallId !== null &&
      candidate.cashCallId !== undefined &&
      typeof candidate.cashCallId !== 'string') ||
    typeof candidate.interestAccrued !== 'string'
  ) {
    throw new TypeError('UpdateJibLinkCashCallCommand returned malformed data');
  }
}

@ApiTags('jib-statements')
@Controller('jib-statements')
export class JibStatementsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a JIB statement' })
  @CheckAbilities({ action: 'create', subject: 'JibStatement' })
  async create(@Body() dto: CreateJibStatementDto): Promise<{ id: string }> {
    const idResult: unknown = await this.commandBus.execute(
      new CreateJibStatementCommand(
        dto.organizationId,
        dto.leaseId,
        dto.partnerId,
        dto.statementPeriodStart,
        dto.statementPeriodEnd,
        dto.dueDate ?? null,
        {
          grossRevenue: dto.grossRevenue,
          netRevenue: dto.netRevenue,
          workingInterestShare: dto.workingInterestShare,
          royaltyShare: dto.royaltyShare,
          previousBalance: dto.previousBalance,
          currentBalance: dto.currentBalance,
          lineItems: dto.lineItems ?? null,
          status: dto.status,
          sentAt: dto.sentAt ?? null,
          paidAt: dto.paidAt ?? null,
        },
      ),
    );
    if (typeof idResult !== 'string') {
      throw new TypeError('CreateJibStatementCommand must return a string id');
    }
    return { id: idResult };
  }

  @Put(':id/link-cash-call')
  @ApiOperation({
    summary: 'Link a JIB statement to a matching cash call and accrue interest',
  })
  @CheckAbilities({ action: 'update', subject: 'JibStatement' })
  async link(
    @Param('id') id: string,
    @Body() dto: UpdateJibLinkDto,
  ): Promise<LinkResult> {
    const result: unknown = await this.commandBus.execute(
      new UpdateJibLinkCashCallCommand(
        dto.organizationId,
        id,
        dto.annualInterestRatePercent,
        dto.dayCountBasis,
      ),
    );
    assertValidLinkResult(result);
    return result;
  }
}
