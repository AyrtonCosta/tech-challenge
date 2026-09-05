import { z } from 'zod';

export const createTransactionFormSchema = z.object({
  accountExternalIdDebit: z.string().uuid(),
  accountExternalIdCredit: z.string().uuid(),
  transferTypeId: z.coerce.number().int().positive(),
  value: z.coerce.number().positive(),
});

export type CreateTransactionForm = z.infer<typeof createTransactionFormSchema>;
