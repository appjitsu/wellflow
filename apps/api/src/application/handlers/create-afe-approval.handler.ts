import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import {
  Inject,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAfeApprovalCommand } from '../commands/create-afe-approval.command';
import type { IAfeApprovalRepository } from '../../domain/repositories/afe-approval.repository.interface';
import type { IAfeRepository } from '../../domain/repositories/afe.repository.interface';
import { AfeApproval } from '../../domain/entities/afe-approval.entity';
import { Money } from '../../domain/value-objects/money';
import { AfeApprovalWorkflowService } from '../../domain/services/afe-approval-workflow.service';
import { randomUUID } from 'crypto';

/**
 * Create AFE Approval Command Handler
 * Handles the creation of partner approvals for AFEs
 */
@CommandHandler(CreateAfeApprovalCommand)
export class CreateAfeApprovalHandler
  implements ICommandHandler<CreateAfeApprovalCommand>
{
  constructor(
    @Inject('AfeApprovalRepository')
    private readonly afeApprovalRepository: IAfeApprovalRepository,
    @Inject('AfeRepository')
    private readonly afeRepository: IAfeRepository,
    private readonly afeApprovalWorkflowService: AfeApprovalWorkflowService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateAfeApprovalCommand): Promise<string> {
    try {
      // Verify AFE exists
      const afe = await this.afeRepository.findById(command.afeId);
      if (!afe) {
        throw new NotFoundException(`AFE with ID ${command.afeId} not found`);
      }

      // Check if approval already exists for this AFE and partner
      const existingApproval =
        await this.afeApprovalRepository.findByAfeAndPartner(
          command.afeId,
          command.partnerId,
        );

      if (existingApproval) {
        throw new ConflictException(
          `Approval already exists for AFE ${command.afeId} and partner ${command.partnerId}`,
        );
      }

      // Validate that AFE requires approval
      if (!this.afeApprovalWorkflowService.requiresPartnerApproval(afe)) {
        throw new BadRequestException('AFE does not require partner approval');
      }

      // Create approved amount if provided
      const approvedAmount = command.approvedAmount
        ? new Money(command.approvedAmount)
        : undefined;

      // Create AFE approval entity
      const approvalId = randomUUID();
      const approval = new AfeApproval(
        approvalId,
        command.afeId,
        command.partnerId,
        command.approvalStatus,
        {
          approvedAmount,
          comments: command.comments,
          approvedByUserId: command.approvedByUserId,
          approvalDate: new Date(),
        },
      );

      // Save approval
      await this.afeApprovalRepository.save(approval);

      // Domain events for approval workflow could be published here
      // to trigger notifications, workflow updates, etc.

      return approvalId;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create AFE approval: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
