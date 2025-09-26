/**
 * Command to generate a regulatory report
 */
export class GenerateRegulatoryReportCommand {
  constructor(
    public readonly reportId: string,
    public readonly generatedByUserId: string,
    public readonly reportData?: Record<string, unknown>,
    public readonly metadata?: Record<string, unknown>,
  ) {}
}
