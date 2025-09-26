export class GetJoaByIdQuery {
  constructor(
    public readonly organizationId: string,
    public readonly id: string,
  ) {}
}
