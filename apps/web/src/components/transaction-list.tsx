'use client';

import { useEffect, useState } from 'react';

import { dateInputToIsoEnd, dateInputToIsoStart } from '../lib/format';
import { fetchTransactionList, type TransactionListResponse } from '../lib/transactions-api';
import type { ListFilters, TransactionStatusFilter } from '../lib/list-url';
import { TransactionListView, type ListViewState } from './transaction-list-view';

const POLL_MS = 2000;
const PAGE_SIZE = 10;

export function TransactionList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TransactionStatusFilter | ''>('');
  const [transferTypeId, setTransferTypeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [state, setState] = useState<ListViewState>('loading');

  const filters: ListFilters = {
    page,
    pageSize: PAGE_SIZE,
    status: status || undefined,
    transferTypeId: transferTypeId ? Number(transferTypeId) : undefined,
    from: dateInputToIsoStart(from),
    to: dateInputToIsoEnd(to),
  };

  useEffect(() => {
    let cancelled = false;

    const load = async (isFirst: boolean): Promise<void> => {
      try {
        const result = await fetchTransactionList(filters);
        if (cancelled) {
          return;
        }

        setData(result);
        setState(result.items.length === 0 ? 'empty' : 'ready');
      } catch {
        if (!cancelled && isFirst) {
          setState('error');
        }
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
  }, [page, status, transferTypeId, from, to]);

  const lastPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section className="space-y-6">
      <form
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Status
          <select
            className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as TransactionStatusFilter | '');
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovada</option>
            <option value="rejected">Rejeitada</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Tipo
          <select
            className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
            value={transferTypeId}
            onChange={(event) => {
              setTransferTypeId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="1">Transferência</option>
            <option value="2">Depósito</option>
            <option value="3">Saque</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          De
          <input
            className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Até
          <input
            className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
          />
        </label>
      </form>

      <TransactionListView state={state} data={data} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <p className="text-sm text-slate-600">
          Página {data?.page ?? page} de {lastPage} ({data?.total ?? 0} no total)
        </p>
        <div className="flex gap-3">
          <button
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40 sm:flex-none"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Anterior
          </button>
          <button
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40 sm:flex-none"
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((current) => current + 1)}
          >
            Próxima
          </button>
        </div>
      </div>
    </section>
  );
}
