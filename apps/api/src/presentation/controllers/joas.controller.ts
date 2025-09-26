import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CheckAbilities } from '../../authorization/abilities.decorator';
import { CreateJoaDto } from '../dtos/create-joa.dto';
import { CreateJoaCommand } from '../../application/commands/create-joa.command';
import { GetJoaByIdQuery } from '../../application/queries/get-joa-by-id.query';
import type { JoaProps } from '../../domain/entities/joint-operating-agreement.entity';

function assertValidJoaPayload(value: unknown): asserts value is JoaProps {
  if (!value || typeof value !== 'object') {
    throw new TypeError('JOA query returned invalid payload');
  }

  const candidate = value as Partial<JoaProps>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.organizationId !== 'string' ||
    typeof candidate.agreementNumber !== 'string' ||
    typeof candidate.effectiveDate !== 'string' ||
    typeof candidate.status !== 'string'
  ) {
    throw new TypeError('JOA payload missing required string fields');
  }
}

@ApiTags('JOAs')
@Controller('joas')
export class JoasController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @CheckAbilities({ action: 'create', subject: 'JointOperatingAgreement' })
  async create(@Body() dto: CreateJoaDto): Promise<{ id: string }> {
    const idResult: unknown = await this.commandBus.execute(
      new CreateJoaCommand(
        dto.organizationId,
        dto.agreementNumber,
        dto.effectiveDate,
        {
          endDate: dto.endDate ?? null,
          operatorOverheadPercent: dto.operatorOverheadPercent ?? null,
          votingThresholdPercent: dto.votingThresholdPercent ?? null,
          nonConsentPenaltyPercent: dto.nonConsentPenaltyPercent ?? null,
          terms: dto.terms ?? null,
        },
      ),
    );
    if (typeof idResult !== 'string') {
      throw new TypeError('CreateJoaCommand must return a string id');
    }
    return { id: idResult };
  }

  @Get(':id')
  @CheckAbilities({ action: 'read', subject: 'JointOperatingAgreement' })
  async getById(@Param('id') id: string): Promise<JoaProps> {
    const organizationId = 'org-placeholder';
    const payload: unknown = await this.queryBus.execute(
      new GetJoaByIdQuery(organizationId, id),
    );
    assertValidJoaPayload(payload);
    return payload;
  }
}
