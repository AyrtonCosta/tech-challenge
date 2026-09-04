import { z } from 'zod';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  type CreateTransactionBody,
  createTransactionBodySchema,
} from './create-transaction.schema';
import {
  type ListTransactionsQuery,
  listTransactionsQuerySchema,
} from './list-transactions.schema';
import {
  TransactionsService,
  type TransactionListResponse,
  type TransactionResponse,
} from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(createTransactionBodySchema)) body: CreateTransactionBody,
  ): Promise<TransactionResponse> {
    return this.transactionsService.create(body);
  }

  @Get()
  list(
    @Query(new ZodValidationPipe(listTransactionsQuerySchema)) query: ListTransactionsQuery,
  ): Promise<TransactionListResponse> {
    return this.transactionsService.list(query);
  }

  @Get(':transactionExternalId')
  findById(
    @Param('transactionExternalId', new ZodValidationPipe(z.string().uuid()))
    transactionExternalId: string,
  ): Promise<TransactionResponse> {
    return this.transactionsService.findById(transactionExternalId);
  }
}
