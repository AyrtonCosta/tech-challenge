import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TOPICS } from '@tech-challenge/contracts';

import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';

const BODY = {
  accountExternalIdDebit: '11111111-1111-1111-1111-111111111111',
  accountExternalIdCredit: '22222222-2222-2222-2222-222222222222',
  transferTypeId: 1,
  value: 120,
};

const STORED = {
  id: '01a06890-f490-751b-ac5a-bd9ea2436780',
  accountExternalIdDebit: BODY.accountExternalIdDebit,
  accountExternalIdCredit: BODY.accountExternalIdCredit,
  transferTypeId: 1,
  value: 120 as unknown as Prisma.Decimal,
  status: 'PENDING' as const,
  createdAt: new Date('2026-09-03T18:38:45.392Z'),
  transactionType: { name: 'TRANSFER' },
};

const STATUS_EVENT = {
  eventId: '33333333-3333-4333-8333-333333333333',
  eventType: 'transaction.status.updated',
  occurredAt: '2026-09-03T19:58:24.406Z',
  version: 1 as const,
  data: {
    transactionExternalId: STORED.id,
    status: 'rejected' as const,
  },
};

function buildService(prisma: {
  $transaction?: jest.Mock;
  transaction?: { findUnique?: jest.Mock; updateMany?: jest.Mock };
}): TransactionsService {
  return new TransactionsService(prisma as unknown as PrismaService);
}

describe('TransactionsService', () => {
  it('grava a transacao como pendente e enfileira o evento na mesma transacao', async () => {
    const tx = {
      transaction: { create: jest.fn().mockResolvedValue(STORED) },
      outboxMessage: { create: jest.fn().mockResolvedValue({}) },
    };
    const $transaction = jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    );
    const service = buildService({ $transaction });

    const response = await service.create(BODY);

    expect(response.transactionStatus).toEqual({ name: 'pending' });
    expect(response.transactionExternalId).toBe(STORED.id);
    expect(tx.transaction.create).toHaveBeenCalledTimes(1);
    expect(tx.outboxMessage.create).toHaveBeenCalledTimes(1);

    const outbox = tx.outboxMessage.create.mock.calls[0]?.[0] as {
      data: { topic: string; key: string; payload: { eventType: string; version: number } };
    };
    expect(outbox.data.topic).toBe(TOPICS.TRANSACTION_CREATED);
    expect(outbox.data.key).toBe(STORED.id);
    expect(outbox.data.payload.eventType).toBe(TOPICS.TRANSACTION_CREATED);
    expect(outbox.data.payload.version).toBe(1);
  });

  it('recusa transferTypeId que nao existe no banco', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('FK', {
      code: 'P2003',
      clientVersion: '7.10.0',
    });
    const service = buildService({
      $transaction: jest.fn().mockRejectedValue(error),
    });

    await expect(service.create({ ...BODY, transferTypeId: 99 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('devolve 404 quando o id nao existe', async () => {
    const service = buildService({
      transaction: { findUnique: jest.fn().mockResolvedValue(null) },
    });

    await expect(service.findById(STORED.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('atualiza so quando o status ainda e pendente', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = buildService({ transaction: { updateMany } });
    await service.applyStatusUpdate(STATUS_EVENT);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: STORED.id, status: 'PENDING' },
      data: { status: 'REJECTED' },
    });
  });
  it('ignora reprocessamento quando nenhuma linha pendente muda', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const service = buildService({ transaction: { updateMany } });
    await expect(service.applyStatusUpdate(STATUS_EVENT)).resolves.toBeUndefined();
  });
});
