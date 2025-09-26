import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetOwnerPaymentByIdQuery } from '../queries/get-owner-payment-by-id.query';
import type { IOwnerPaymentRepository } from '../../domain/repositories/owner-payment.repository.interface';
import type { OwnerPaymentProps } from '../../domain/entities/owner-payment.entity';

@QueryHandler(GetOwnerPaymentByIdQuery)
export class GetOwnerPaymentByIdHandler
  implements IQueryHandler<GetOwnerPaymentByIdQuery, OwnerPaymentProps>
{
  constructor(
    @Inject('OwnerPaymentRepository')
    private readonly repo: IOwnerPaymentRepository,
  ) {}

  async execute(query: GetOwnerPaymentByIdQuery): Promise<OwnerPaymentProps> {
    const payment = await this.repo.findById(query.id);
    if (!payment) throw new NotFoundException('OwnerPayment not found');
    return payment.toPersistence();
  }
}
