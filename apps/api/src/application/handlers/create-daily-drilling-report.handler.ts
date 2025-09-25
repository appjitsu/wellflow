import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateDailyDrillingReportCommand } from '../commands/create-daily-drilling-report.command';
import { DailyDrillingReport } from '../../domain/entities/daily-drilling-report.entity';
import type { IDailyDrillingReportRepository } from '../../domain/repositories/daily-drilling-report.repository.interface';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import { DailyDrillingReportCreatedEvent } from '../../domain/events/daily-drilling-report-created.event';

@CommandHandler(CreateDailyDrillingReportCommand)
export class CreateDailyDrillingReportHandler
  implements ICommandHandler<CreateDailyDrillingReportCommand>
{
  constructor(
    @Inject('DailyDrillingReportRepository')
    private readonly repo: IDailyDrillingReportRepository,
    private readonly outbox: OutboxService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateDailyDrillingReportCommand) {
    const dto = command.dto;
    const entity = new DailyDrillingReport({
      id: dto.id,
      organizationId: dto.organizationId,
      wellId: dto.wellId,
      reportDate: new Date(dto.reportDate),
    });

    const saved = await this.repo.save(entity);

    const event = new DailyDrillingReportCreatedEvent(
      saved.getId(),
      saved.getOrganizationId(),
      saved.getWellId(),
      dto.reportDate,
    );

    // fire-and-forget in-process event (optional)
    this.eventBus.publish(event);

    // outbox for reliable delivery
    await this.outbox.record({
      eventType: event.constructor.name,
      aggregateType: 'DailyDrillingReport',
      aggregateId: saved.getId(),
      organizationId: saved.getOrganizationId(),
      payload: {
        id: saved.getId(),
        wellId: saved.getWellId(),
        reportDate: dto.reportDate,
      },
    });

    return { id: saved.getId() };
  }
}
