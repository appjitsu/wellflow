import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ValidateRegulatoryReportCommand } from '../commands/validate-regulatory-report.command';
import { ReportValidationService } from '../services/report-validation.service';

@CommandHandler(ValidateRegulatoryReportCommand)
export class ValidateRegulatoryReportHandler
  implements ICommandHandler<ValidateRegulatoryReportCommand>
{
  constructor(private readonly service: ReportValidationService) {}

  async execute(cmd: ValidateRegulatoryReportCommand): Promise<void> {
    await this.service.validate(cmd.reportId);
  }
}
