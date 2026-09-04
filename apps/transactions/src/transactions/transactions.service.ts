import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  TOPICS,
  transactionStatusUpdatedEventSchema,
  type TransactionCreatedEvent,
} from '@tech-challenge/contracts';
import { randomUUID } from 'node:crypto';
import type { ListTransactionsQuery } from './list-transactions.schema';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTransactionBody } from './create-transaction.schema';
import { toContractStatus, toStoredStatus } from './transaction-status.mapper';

export type TransactionResponse = {
  transactionExternalId: string;
  transactionType: { name: string };
  transactionStatus: { name: string };
  value: number;
  createdAt: Date;
};

export type TransactionListResponse = {
  items: TransactionResponse[];
  page: number;
  pageSize: number;
  total: number;
};

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateTransactionBody): Promise<TransactionResponse> {
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            accountExternalIdDebit: body.accountExternalIdDebit,
            accountExternalIdCredit: body.accountExternalIdCredit,
            transferTypeId: body.transferTypeId,
            value: body.value,
          },
          include: { transactionType: true },
        });

        const event: TransactionCreatedEvent = {
          eventId: randomUUID(),
          eventType: TOPICS.TRANSACTION_CREATED,
          occurredAt: new Date().toISOString(),
          version: 1,
          data: {
            transactionExternalId: transaction.id,
            accountExternalIdDebit: transaction.accountExternalIdDebit,
            accountExternalIdCredit: transaction.accountExternalIdCredit,
            transferTypeId: transaction.transferTypeId,
            value: body.value,
          },
        };

        await tx.outboxMessage.create({
          data: {
            topic: TOPICS.TRANSACTION_CREATED,
            key: transaction.id,
            payload: event,
            transactionId: transaction.id,
          },
        });

        return transaction;
      });

      return this.toResponse(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException({
          message: 'Payload invalido',
          issues: [{ path: 'transferTypeId', message: 'Tipo de transferencia inexistente' }],
        });
      }

      throw error;
    }
  }

  private toResponse(transaction: {
    id: string;
    value: Prisma.Decimal;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
    transactionType: { name: string };
  }): TransactionResponse {
    return {
      transactionExternalId: transaction.id,
      transactionType: { name: transaction.transactionType.name },
      transactionStatus: { name: toContractStatus(transaction.status) },
      value: Number(transaction.value),
      createdAt: transaction.createdAt,
    };
  }

  async findById(transactionExternalId: string): Promise<TransactionResponse> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionExternalId },
      include: { transactionType: true },
    });

    if (!transaction) {
      throw new NotFoundException({
        message: 'Transacao nao encontrada',
        transactionExternalId,
      });
    }
    return this.toResponse(transaction);
  }

  async list(query: ListTransactionsQuery): Promise<TransactionListResponse> {
    const where: Prisma.TransactionWhereInput = {
      status: query.status ? toStoredStatus(query.status) : undefined,
      transferTypeId: query.transferTypeId,
      createdAt: {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      },
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: { transactionType: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toResponse(row)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async applyStatusUpdate(payload: unknown): Promise<void> {
    const event = transactionStatusUpdatedEventSchema.parse(payload);

    await this.prisma.transaction.updateMany({
      where: {
        id: event.data.transactionExternalId,
        status: 'PENDING',
      },
      data: { status: toStoredStatus(event.data.status) },
    });
  }
}
