import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubmitRegulatoryReportCommand } from '../commands/submit-regulatory-report.command';
import { ReportSubmissionService } from '../services/report-submission.service';
import { SubmissionReceipt } from '../../infrastructure/adapters/regulator-adapter.interface';

@CommandHandler(SubmitRegulatoryReportCommand)
export class SubmitRegulatoryReportHandler
  implements ICommandHandler<SubmitRegulatoryReportCommand>
{
  constructor(private readonly service: ReportSubmissionService) {}

  async execute(
    cmd: SubmitRegulatoryReportCommand,
  ): Promise<SubmissionReceipt> {
    return this.service.submit(cmd.reportId, {
      amendmentType: cmd.amendmentType,
    });
  }
}
