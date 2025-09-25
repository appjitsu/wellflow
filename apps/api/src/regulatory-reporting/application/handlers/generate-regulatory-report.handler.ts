import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GenerateRegulatoryReportCommand } from '../commands/generate-regulatory-report.command';
import { ReportGenerationService } from '../services/report-generation.service';

@CommandHandler(GenerateRegulatoryReportCommand)
export class GenerateRegulatoryReportHandler
  implements ICommandHandler<GenerateRegulatoryReportCommand>
{
  constructor(private readonly service: ReportGenerationService) {}

  async execute(cmd: GenerateRegulatoryReportCommand): Promise<string> {
    const instance = await this.service.generate(
      cmd.organizationId,
      cmd.jurisdiction,
      cmd.reportType,
      cmd.period,
      cmd.createdByUserId,
    );
    return instance.getId();
  }
}
