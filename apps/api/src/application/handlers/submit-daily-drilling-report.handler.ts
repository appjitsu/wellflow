import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { SubmitDailyDrillingReportCommand } from '../commands/submit-daily-drilling-report.command';
import type { IDailyDrillingReportRepository } from '../../domain/repositories/daily-drilling-report.repository.interface';
import { Inject } from '@nestjs/common';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import { DailyDrillingReportSubmittedEvent } from '../../domain/events/daily-drilling-report-submitted.event';

@CommandHandler(SubmitDailyDrillingReportCommand)
export class SubmitDailyDrillingReportHandler
  implements ICommandHandler<SubmitDailyDrillingReportCommand>
{
  constructor(
    @Inject('DailyDrillingReportRepository')
    private readonly repo: IDailyDrillingReportRepository,
    private readonly outbox: OutboxService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    cmd: SubmitDailyDrillingReportCommand,
  ): Promise<{ id: string; status: 'submitted' }> {
    const found = await this.repo.findById(cmd.id);
    if (!found) throw new NotFoundException('DailyDrillingReport not found');

    const submittedAt = new Date().toISOString();

    const event = new DailyDrillingReportSubmittedEvent(
      found.getId(),
      found.getOrganizationId(),
      found.getWellId(),
      submittedAt,
    );

    // Publish domain event
    this.eventBus.publish(event);

    // Outbox record
    await this.outbox.record({
      eventType: event.constructor.name,
      aggregateType: 'DailyDrillingReport',
      aggregateId: found.getId(),
      organizationId: found.getOrganizationId(),
      payload: { id: found.getId(), wellId: found.getWellId(), submittedAt },
    });

    return { id: found.getId(), status: 'submitted' };
  }
}
