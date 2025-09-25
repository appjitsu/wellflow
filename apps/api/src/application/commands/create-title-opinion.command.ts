import { ICommand } from '@nestjs/cqrs';
import { TitleStatus } from '../../domain/entities/title-opinion.entity';

export class CreateTitleOpinionCommand implements ICommand {
  constructor(
    public readonly organizationId: string,
    public readonly leaseId: string,
    public readonly opinionNumber: string,
    public readonly examinerName: string,
    public readonly examinationDate: Date,
    public readonly effectiveDate: Date,
    public readonly titleStatus: TitleStatus,
    public readonly findings?: string,
    public readonly recommendations?: string,
  ) {}
}
