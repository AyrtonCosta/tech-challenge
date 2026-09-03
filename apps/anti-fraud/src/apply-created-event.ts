import {
  TOPICS,
  transactionCreatedEventSchema,
  type TransactionStatusUpdatedEvent,
} from '@tech-challenge/contracts';
import { randomUUID } from 'node:crypto';

import { evaluateTransaction } from './evaluate-transaction';

export function applyCreatedEvent(payload: unknown): TransactionStatusUpdatedEvent {
  const event = transactionCreatedEventSchema.parse(payload);

  return {
    eventId: randomUUID(),
    eventType: TOPICS.TRANSACTION_STATUS_UPDATED,
    occurredAt: new Date().toISOString(),
    version: 1,
    data: {
      transactionExternalId: event.data.transactionExternalId,
      status: evaluateTransaction(event.data.value),
    },
  };
}
