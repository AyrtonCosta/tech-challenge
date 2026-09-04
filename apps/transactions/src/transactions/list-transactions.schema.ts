import { TRANSACTION_STATUSES } from '@tech-challenge/contracts';
import { z } from 'zod';

export const listTransactionsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(50).default(10),
    status: z.enum(TRANSACTION_STATUSES).optional(),
    transferTypeId: z.coerce.number().int().positive().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    path: ['to'],
    message: 'to deve ser maior ou igual a from',
  });

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
