import { AmendmentType } from '../dtos/submit-regulatory-report.dto';

export class SubmitRegulatoryReportCommand {
  constructor(
    public readonly reportId: string,
    public readonly amendmentType: AmendmentType = 'ORIGINAL',
  ) {}
}
