import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateLosCommand } from '../commands/create-los.command';
import type { ILosRepository } from '../../domain/repositories/lease-operating-statement.repository.interface';
import { LeaseOperatingStatement } from '../../domain/entities/lease-operating-statement.entity';
import { StatementMonth } from '../../domain/value-objects/statement-month';
import { randomUUID } from 'crypto';

/**
 * Create LOS Command Handler
 * Handles the creation of new Lease Operating Statements
 */
@CommandHandler(CreateLosCommand)
export class CreateLosHandler implements ICommandHandler<CreateLosCommand> {
  constructor(
    @Inject('LosRepository')
    private readonly losRepository: ILosRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateLosCommand): Promise<string> {
    try {
      // Create statement month value object
      const statementMonth = new StatementMonth(command.year, command.month);

      // Check if LOS already exists for this lease and month
      const existingLos = await this.losRepository.findByLeaseIdAndMonth(
        command.leaseId,
        statementMonth,
      );

      if (existingLos) {
        throw new ConflictException(
          `Lease Operating Statement already exists for lease ${command.leaseId} for ${statementMonth.toDisplayString()}`,
        );
      }

      // Create LOS entity
      const losId = randomUUID();
      const los = new LeaseOperatingStatement(
        losId,
        command.organizationId,
        command.leaseId,
        statementMonth,
        {
          notes: command.notes,
        },
      );

      // Save LOS
      await this.losRepository.save(los);

      // Publish domain events
      const events = los.getDomainEvents();
      for (const event of events) {
        this.eventBus.publish(event);
      }
      los.clearDomainEvents();

      return losId;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create Lease Operating Statement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
