export class GetCashCallByIdQuery {
  constructor(
    public readonly organizationId: string,
    public readonly id: string,
  ) {}
}
