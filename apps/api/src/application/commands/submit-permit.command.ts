/**
 * Command to submit a permit for review
 */
export class SubmitPermitCommand {
  constructor(
    public readonly permitId: string,
    public readonly submittedByUserId: string,
  ) {}
}
