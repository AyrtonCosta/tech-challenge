'use client';

import { useEffect, useState } from 'react';

import { fetchTransactionById, type TransactionItem } from '../lib/transactions-api';
import { TransactionDetailView, type DetailViewState } from './transaction-detail-view';

const POLL_MS = 2000;

type TransactionDetailProps = {
  transactionExternalId: string;
};

export function TransactionDetail({ transactionExternalId }: TransactionDetailProps) {
  const [data, setData] = useState<TransactionItem | null>(null);
  const [state, setState] = useState<DetailViewState>('loading');

  useEffect(() => {
    let cancelled = false;

    const load = async (isFirst: boolean): Promise<void> => {
      try {
        const result = await fetchTransactionById(transactionExternalId);
        if (cancelled) {
          return;
        }

        setData(result);
        setState('ready');
      } catch (error) {
        if (cancelled || !isFirst) {
          return;
        }

        setState(error instanceof Error && error.message === 'not-found' ? 'not-found' : 'error');
      }
    };

    void load(true);
    const timer = setInterval(() => {
      void load(false);
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [transactionExternalId]);

  return <TransactionDetailView state={state} data={data} />;
}
