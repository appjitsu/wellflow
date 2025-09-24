import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAfesRequiringApprovalQuery } from '../queries/get-afes-requiring-approval.query';
import type { IAfeRepository } from '../../domain/repositories/afe.repository.interface';
import { AfeDto } from '../dtos/afe.dto';

/**
 * Get AFEs Requiring Approval Query Handler
 * Handles retrieving AFEs that require approval
 */
@QueryHandler(GetAfesRequiringApprovalQuery)
export class GetAfesRequiringApprovalHandler
  implements IQueryHandler<GetAfesRequiringApprovalQuery>
{
  constructor(
    @Inject('AfeRepository')
    private readonly afeRepository: IAfeRepository,
  ) {}

  async execute(query: GetAfesRequiringApprovalQuery): Promise<AfeDto[]> {
    const afes = await this.afeRepository.findRequiringApproval(
      query.organizationId,
    );

    return AfeDto.fromEntities(afes);
  }
}
