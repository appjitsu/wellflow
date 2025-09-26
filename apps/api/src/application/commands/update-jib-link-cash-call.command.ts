export class UpdateJibLinkCashCallCommand {
  constructor(
    public readonly organizationId: string,
    public readonly jibId: string,
    public readonly annualInterestRatePercent: string,
    public readonly dayCountBasis?: 360 | 365,
  ) {}
}
