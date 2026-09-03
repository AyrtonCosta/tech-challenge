import { z } from 'zod';

import { TRANSACTION_STATUSES } from './transaction-status';

const eventEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    eventId: z.string().uuid(),
    eventType: z.string().min(1),
    occurredAt: z.string().datetime(),
    version: z.literal(1),
    data: dataSchema,
  });

export const transactionCreatedDataSchema = z.object({
  transactionExternalId: z.string().uuid(),
  accountExternalIdDebit: z.string().uuid(),
  accountExternalIdCredit: z.string().uuid(),
  transferTypeId: z.number().int().positive(),
  value: z.number().positive(),
});

export const transactionStatusUpdatedDataSchema = z.object({
  transactionExternalId: z.string().uuid(),
  status: z.enum(TRANSACTION_STATUSES),
});

export const transactionCreatedEventSchema = eventEnvelopeSchema(transactionCreatedDataSchema);

export const transactionStatusUpdatedEventSchema = eventEnvelopeSchema(
  transactionStatusUpdatedDataSchema,
);

export type TransactionCreatedEvent = z.infer<typeof transactionCreatedEventSchema>;
export type TransactionStatusUpdatedEvent = z.infer<typeof transactionStatusUpdatedEventSchema>;
