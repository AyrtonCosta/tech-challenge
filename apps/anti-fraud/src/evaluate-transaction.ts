import type { TransactionStatus } from '@tech-challenge/contracts';

const FRAUD_THRESHOLD = 1000;

export function evaluateTransaction(value: number): TransactionStatus {
  return value > FRAUD_THRESHOLD ? 'rejected' : 'approved';
}
