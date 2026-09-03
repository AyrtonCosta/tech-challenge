import { TOPICS, type TransactionCreatedEvent } from '@tech-challenge/contracts';

import { applyCreatedEvent } from './apply-created-event';

const BASE: TransactionCreatedEvent = {
  eventId: '11111111-1111-4111-8111-111111111111',
  eventType: TOPICS.TRANSACTION_CREATED,
  occurredAt: '2026-09-03T18:38:45.392Z',
  version: 1,
  data: {
    transactionExternalId: '01a06890-f490-751b-ac5a-bd9ea2436780',
    accountExternalIdDebit: '11111111-1111-1111-1111-111111111111',
    accountExternalIdCredit: '22222222-2222-2222-2222-222222222222',
    transferTypeId: 1,
    value: 120,
  },
};

describe('applyCreatedEvent', () => {
  it('aprova e devolve o envelope de status atualizado', () => {
    const result = applyCreatedEvent({ ...BASE, data: { ...BASE.data, value: 1000 } });

    expect(result.eventType).toBe(TOPICS.TRANSACTION_STATUS_UPDATED);
    expect(result.version).toBe(1);
    expect(result.data).toEqual({
      transactionExternalId: BASE.data.transactionExternalId,
      status: 'approved',
    });
  });

  it('rejeita valor acima de 1000', () => {
    const result = applyCreatedEvent({ ...BASE, data: { ...BASE.data, value: 1000.01 } });

    expect(result.data.status).toBe('rejected');
  });

  it('recusa payload que nao e o evento de criacao', () => {
    expect(() => applyCreatedEvent({ foo: 1 })).toThrow();
  });
});
