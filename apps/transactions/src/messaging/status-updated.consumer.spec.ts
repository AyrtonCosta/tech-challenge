import { TransactionsService } from '../transactions/transactions.service';
import { StatusUpdatedConsumer } from './status-updated.consumer';

jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

const STATUS_EVENT = {
  eventId: '33333333-3333-4333-8333-333333333333',
  eventType: 'transaction.status.updated',
  occurredAt: '2026-09-03T19:58:24.406Z',
  version: 1 as const,
  data: {
    transactionExternalId: '01a06890-f490-751b-ac5a-bd9ea2436780',
    status: 'rejected' as const,
  },
};

function buildConsumer(applyStatusUpdate: jest.Mock): StatusUpdatedConsumer {
  const config = {
    get: jest.fn().mockReturnValue('tech-challenge'),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'KAFKA_BROKERS') {
        return 'localhost:9092';
      }

      return 'transactions-consumer';
    }),
  };

  return new StatusUpdatedConsumer(
    config as never,
    { applyStatusUpdate } as unknown as TransactionsService,
  );
}

describe('StatusUpdatedConsumer', () => {
  it('repassa o JSON para a atualizacao de status', async () => {
    const applyStatusUpdate = jest.fn().mockResolvedValue(undefined);
    const consumer = buildConsumer(applyStatusUpdate);

    await consumer.handleMessage(Buffer.from(JSON.stringify(STATUS_EVENT)));

    expect(applyStatusUpdate).toHaveBeenCalledWith(STATUS_EVENT);
  });

  it('ignora mensagem sem valor', async () => {
    const applyStatusUpdate = jest.fn();
    const consumer = buildConsumer(applyStatusUpdate);

    await consumer.handleMessage(null);

    expect(applyStatusUpdate).not.toHaveBeenCalled();
  });
});
