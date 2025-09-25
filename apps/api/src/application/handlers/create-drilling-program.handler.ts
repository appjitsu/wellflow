import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateDrillingProgramCommand } from '../commands/create-drilling-program.command';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import type { IDrillingProgramRepository } from '../../domain/repositories/drilling-program.repository.interface';
import { DrillingProgramCreatedEvent } from '../../domain/events/drilling-program-created.event';
import { DrillingProgram } from '../../domain/entities/drilling-program.entity';

@CommandHandler(CreateDrillingProgramCommand)
export class CreateDrillingProgramHandler
  implements ICommandHandler<CreateDrillingProgramCommand>
{
  constructor(
    @Inject('DrillingProgramRepository')
    private readonly repo: IDrillingProgramRepository,
    private readonly eventBus: EventBus,
    private readonly outbox: OutboxService,
  ) {}

  async execute(command: CreateDrillingProgramCommand): Promise<string> {
    if (!command.organizationId || !command.wellId || !command.programName) {
      throw new BadRequestException(
        'organizationId, wellId, and programName are required',
      );
    }

    const entity = new DrillingProgram({
      id: randomUUID(),
      organizationId: command.organizationId,
      wellId: command.wellId,
      programName: command.programName,
      version: command.options?.version,
      status: command.options?.status,
      afeId: command.options?.afeId,
      program: command.options?.program,
      hazards: command.options?.hazards,
      approvals: command.options?.approvals,
    });

    const saved = await this.repo.save(entity);

    // Publish domain event
    this.eventBus.publish(
      new DrillingProgramCreatedEvent(
        saved.getId(),
        saved.getOrganizationId(),
        saved.getWellId(),
        saved.getProgramName(),
      ),
    );

    // Record to outbox for reliable external publishing
    await this.outbox.record({
      eventType: 'DrillingProgramCreated',
      aggregateType: 'DrillingProgram',
      aggregateId: saved.getId(),
      organizationId: saved.getOrganizationId(),
      payload: {
        id: saved.getId(),
        organizationId: saved.getOrganizationId(),
        wellId: saved.getWellId(),
        programName: saved.getProgramName(),
      },
    });

    return saved.getId();
  }
}
