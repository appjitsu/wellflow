import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateJibLinkCashCallCommand } from '../commands/update-jib-link-cash-call.command';
import type { IJibStatementRepository } from '../../domain/repositories/jib-statement.repository.interface';
import type { ICashCallRepository } from '../../domain/repositories/cash-call.repository.interface';
import { JibBalanceService } from '../../financial/jib-balance.service';
import { JibLinkingService } from '../../financial/jib-linking.service';
import { CashCall } from '../../domain/entities/cash-call.entity';

@Injectable()
@CommandHandler(UpdateJibLinkCashCallCommand)
export class UpdateJibLinkCashCallHandler
  implements
    ICommandHandler<
      UpdateJibLinkCashCallCommand,
      { jibId: string; cashCallId: string | null; interestAccrued: string }
    >
{
  constructor(
    @Inject('JibStatementRepository')
    private readonly jibRepo: IJibStatementRepository,
    @Inject('CashCallRepository')
    private readonly cashCallRepo: ICashCallRepository,
    private readonly balanceService: JibBalanceService,
    private readonly linkingService: JibLinkingService,
  ) {}

  async execute(command: UpdateJibLinkCashCallCommand): Promise<{
    jibId: string;
    cashCallId: string | null;
    interestAccrued: string;
  }> {
    const jib = await this.jibRepo.findById(command.jibId);
    if (!jib) throw new NotFoundException('JIB statement not found');
    if (jib.getOrganizationId() !== command.organizationId)
      throw new BadRequestException('Org mismatch');

    // Load candidate cash calls for org; downstream filter by lease/partner/month
    const candidates = await this.cashCallRepo.findByOrganizationId(
      command.organizationId,
      {},
    );
    const selected = this.linkingService.selectCashCallForJib(jib, candidates);
    const selectedId = selected instanceof CashCall ? selected.getId() : null;

    // Interest accrual
    const { interestAccrued } = this.balanceService.calculateInterest(
      {
        currentBalance: jib.getCurrentBalance(),
        dueDate: jib.getDueDate() ?? undefined,
      },
      {
        annualInterestRatePercent: command.annualInterestRatePercent,
        dayCountBasis: command.dayCountBasis ?? 365,
      },
    );

    if (selectedId) {
      jib.linkCashCall(selectedId);
    }
    jib.applyInterest(interestAccrued);

    await this.jibRepo.save(jib);
    return {
      jibId: jib.getId(),
      cashCallId: selectedId,
      interestAccrued,
    };
  }
}
