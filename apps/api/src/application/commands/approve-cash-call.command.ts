export class ApproveCashCallCommand {
  constructor(
    public readonly organizationId: string,
    public readonly id: string,
  ) {}
}
