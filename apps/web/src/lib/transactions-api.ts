import { buildListUrl, type ListFilters } from './list-url';
import type { CreateTransactionForm } from './create-transaction.schema';
export type TransactionItem = {
  transactionExternalId: string;
  transactionType: { name: string };
  transactionStatus: { name: string };
  value: number;
  createdAt: string;
};

export type TransactionListResponse = {
  items: TransactionItem[];
  page: number;
  pageSize: number;
  total: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function fetchTransactionList(filters: ListFilters): Promise<TransactionListResponse> {
  const response = await fetch(buildListUrl(API_URL, filters));

  if (!response.ok) {
    throw new Error(`Lista falhou: ${response.status}`);
  }

  return (await response.json()) as TransactionListResponse;
}

export async function fetchTransactionById(
  transactionExternalId: string,
): Promise<TransactionItem> {
  const response = await fetch(`${API_URL}/transactions/${transactionExternalId}`);

  if (response.status === 404) {
    throw new Error('not-found');
  }

  if (!response.ok) {
    throw new Error(`Detalhe falhou: ${response.status}`);
  }

  return (await response.json()) as TransactionItem;
}

export async function createTransaction(body: CreateTransactionForm): Promise<TransactionItem> {
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('create-failed');
  }

  return (await response.json()) as TransactionItem;
}
