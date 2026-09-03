import { z } from 'zod';

export const createTransactionBodySchema = z.object({
  accountExternalIdDebit: z.string().uuid(),
  accountExternalIdCredit: z.string().uuid(),
  transferTypeId: z.number().int().positive(),
  value: z.number().positive(),
});

export type CreateTransactionBody = z.infer<typeof createTransactionBodySchema>;
