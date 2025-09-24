import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateRevenueDistributionCommand } from '../commands/create-revenue-distribution.command';
import { RevenueDistribution } from '../../domain/entities/revenue-distribution.entity';
import { ProductionMonth } from '../../domain/value-objects/production-month';
import { Money } from '../../domain/value-objects/money';
import type { IRevenueDistributionRepository } from '../../domain/repositories/revenue-distribution.repository.interface';

/**
 * Create Revenue Distribution Command Handler
 * Handles the creation of new revenue distributions
 */
@CommandHandler(CreateRevenueDistributionCommand)
export class CreateRevenueDistributionHandler
  implements ICommandHandler<CreateRevenueDistributionCommand>
{
  constructor(
    @Inject('RevenueDistributionRepository')
    private readonly revenueDistributionRepository: IRevenueDistributionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateRevenueDistributionCommand): Promise<string> {
    try {
      // Create value objects
      const productionMonth = ProductionMonth.fromString(
        command.productionMonth,
      );
      const currency = 'USD'; // Default currency, could be configurable

      // Check if revenue distribution already exists
      const existing =
        await this.revenueDistributionRepository.findByWellPartnerAndMonth(
          command.wellId,
          command.partnerId,
          productionMonth,
        );

      if (existing) {
        throw new ConflictException(
          `Revenue distribution already exists for partner ${command.partnerId} in well ${command.wellId} for ${command.productionMonth}`,
        );
      }

      // Create revenue breakdown with Money value objects
      const revenueBreakdown = {
        oilRevenue: command.revenueBreakdown.oilRevenue
          ? new Money(command.revenueBreakdown.oilRevenue, currency)
          : undefined,
        gasRevenue: command.revenueBreakdown.gasRevenue
          ? new Money(command.revenueBreakdown.gasRevenue, currency)
          : undefined,
        totalRevenue: new Money(
          command.revenueBreakdown.totalRevenue,
          currency,
        ),
        severanceTax: command.revenueBreakdown.severanceTax
          ? new Money(command.revenueBreakdown.severanceTax, currency)
          : undefined,
        adValorem: command.revenueBreakdown.adValorem
          ? new Money(command.revenueBreakdown.adValorem, currency)
          : undefined,
        transportationCosts: command.revenueBreakdown.transportationCosts
          ? new Money(command.revenueBreakdown.transportationCosts, currency)
          : undefined,
        processingCosts: command.revenueBreakdown.processingCosts
          ? new Money(command.revenueBreakdown.processingCosts, currency)
          : undefined,
        otherDeductions: command.revenueBreakdown.otherDeductions
          ? new Money(command.revenueBreakdown.otherDeductions, currency)
          : undefined,
        netRevenue: new Money(command.revenueBreakdown.netRevenue, currency),
      };

      // Validate that net revenue is not negative
      if (revenueBreakdown.netRevenue.getAmount() < 0) {
        throw new BadRequestException('Net revenue cannot be negative');
      }

      // Create revenue distribution entity
      const revenueDistribution = RevenueDistribution.create(
        command.organizationId,
        command.wellId,
        command.partnerId,
        command.divisionOrderId,
        productionMonth,
        command.productionVolumes,
        revenueBreakdown,
      );

      // Save revenue distribution
      await this.revenueDistributionRepository.save(revenueDistribution);

      // Publish domain events
      const events = revenueDistribution.getDomainEvents();
      for (const event of events) {
        this.eventBus.publish(event);
      }
      revenueDistribution.clearDomainEvents();

      return revenueDistribution.getId();
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create revenue distribution: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
