/**
 * Command to submit a regulatory report to a regulatory agency
 */
export class SubmitRegulatoryReportCommand {
  constructor(
    public readonly reportId: string,
    public readonly submittedByUserId: string,
    public readonly submissionMethod?: string,
    public readonly externalSubmissionId?: string,
  ) {}
}
