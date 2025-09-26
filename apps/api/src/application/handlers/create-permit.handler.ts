import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { PermitRepository } from '../../domain/repositories/permit.repository';
import { Permit } from '../../domain/entities/permit.entity';
import { PermitType } from '../../domain/value-objects/permit-type.vo';
import { CreatePermitCommand } from '../commands/create-permit.command';

/**
 * Command handler for creating permits
 * Implements CQRS command handling pattern
 */
@CommandHandler(CreatePermitCommand)
export class CreatePermitHandler
  implements ICommandHandler<CreatePermitCommand>
{
  constructor(
    @Inject('PermitRepository')
    private readonly permitRepository: PermitRepository,
  ) {}

  async execute(command: CreatePermitCommand): Promise<string> {
    await this.validatePermitNumberUniqueness(command.permitNumber);

    const permitType = PermitType.fromString(command.permitType);
    const permit = Permit.create(
      command.permitNumber,
      permitType,
      command.organizationId,
      command.issuingAgency,
      command.createdByUserId,
    );

    this.setOptionalProperties(permit, command);

    await this.permitRepository.save(permit);
    return permit.id;
  }

  private async validatePermitNumberUniqueness(
    permitNumber: string,
  ): Promise<void> {
    const existingPermit =
      await this.permitRepository.findByPermitNumber(permitNumber);
    if (existingPermit) {
      throw new Error(`Permit number ${permitNumber} already exists`);
    }
  }

  private setOptionalProperties(
    permit: Permit,
    command: CreatePermitCommand,
  ): void {
    if (command.wellId) permit.wellId = command.wellId;
    if (command.regulatoryAuthority)
      permit.regulatoryAuthority = command.regulatoryAuthority;
    if (command.applicationDate)
      permit.applicationDate = command.applicationDate;
    if (command.expirationDate) permit.expirationDate = command.expirationDate;
    if (command.permitConditions)
      permit.permitConditions = command.permitConditions;
    if (command.complianceRequirements)
      permit.complianceRequirements = command.complianceRequirements;
    if (command.feeAmount !== undefined) permit.feeAmount = command.feeAmount;
    if (command.bondAmount !== undefined)
      permit.bondAmount = command.bondAmount;
    if (command.bondType) permit.bondType = command.bondType;
    if (command.location) permit.location = command.location;
    if (command.facilityId) permit.facilityId = command.facilityId;
    if (command.documentIds) permit.documentIds = command.documentIds;
  }
}
