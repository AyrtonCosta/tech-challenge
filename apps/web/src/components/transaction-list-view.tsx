import Link from 'next/link';

import { formatBRL, formatDate, formatTypeName } from '../lib/format';
import type { TransactionListResponse } from '../lib/transactions-api';

export type ListViewState = 'loading' | 'error' | 'empty' | 'ready';

type TransactionListViewProps = {
  state: ListViewState;
  data: TransactionListResponse | null;
};

const statusClass: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

export function TransactionListView({ state, data }: TransactionListViewProps) {
  if (state === 'loading') {
    return (
      <p className="rounded-md bg-white px-4 py-6 text-sm text-slate-500">Carregando transações…</p>
    );
  }

  if (state === 'error') {
    return (
      <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-800">
        Não foi possível carregar as transações.
      </p>
    );
  }

  if (state === 'empty') {
    return (
      <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
        Nenhuma transação encontrada.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {data?.items.map((item) => (
          <li
            key={item.transactionExternalId}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <Link
              className="break-all font-mono text-xs text-slate-900 underline"
              href={`/transactions/${item.transactionExternalId}`}
            >
              {item.transactionExternalId}
            </Link>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Tipo</dt>
                <dd>{formatTypeName(item.transactionType.name)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[item.transactionStatus.name] ?? 'bg-slate-100 text-slate-700'}`}
                  >
                    {statusLabel[item.transactionStatus.name] ?? item.transactionStatus.name}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Valor</dt>
                <dd>{formatBRL(item.value)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Criada em</dt>
                <dd className="text-slate-600">{formatDate(item.createdAt)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Id</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.transactionExternalId} className="border-t border-slate-100">
                <td className="max-w-56 truncate px-4 py-3 font-mono text-xs">
                  <Link
                    className="text-slate-900 underline"
                    href={`/transactions/${item.transactionExternalId}`}
                  >
                    {item.transactionExternalId}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatTypeName(item.transactionType.name)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[item.transactionStatus.name] ?? 'bg-slate-100 text-slate-700'}`}
                  >
                    {statusLabel[item.transactionStatus.name] ?? item.transactionStatus.name}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{formatBRL(item.value)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(item.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
