export const TRANSACTION_STATUSES = ['pending', 'approved', 'rejected'] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
