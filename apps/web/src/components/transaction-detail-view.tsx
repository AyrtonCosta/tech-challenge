import { formatBRL, formatDate, formatTypeName } from '../lib/format';
import type { TransactionItem } from '../lib/transactions-api';

export type DetailViewState = 'loading' | 'error' | 'not-found' | 'ready';

type TransactionDetailViewProps = {
  state: DetailViewState;
  data: TransactionItem | null;
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

export function TransactionDetailView({ state, data }: TransactionDetailViewProps) {
  if (state === 'loading') {
    return (
      <p className="rounded-md bg-white px-4 py-6 text-sm text-slate-500">Carregando transação…</p>
    );
  }

  if (state === 'not-found') {
    return (
      <p className="rounded-md bg-white px-4 py-6 text-sm text-slate-500">
        Transação não encontrada.
      </p>
    );
  }

  if (state === 'error' || !data) {
    return (
      <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-800">
        Não foi possível carregar a transação.
      </p>
    );
  }

  return (
    <dl className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
      <div>
        <dt className="text-xs uppercase tracking-wide text-slate-500">Id</dt>
        <dd className="mt-1 break-all font-mono text-sm">{data.transactionExternalId}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-slate-500">Tipo</dt>
        <dd className="mt-1 text-sm">{formatTypeName(data.transactionType.name)}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
        <dd className="mt-1">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[data.transactionStatus.name] ?? 'bg-slate-100 text-slate-700'}`}
          >
            {statusLabel[data.transactionStatus.name] ?? data.transactionStatus.name}
          </span>
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-slate-500">Valor</dt>
        <dd className="mt-1 text-sm">{formatBRL(data.value)}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs uppercase tracking-wide text-slate-500">Criada em</dt>
        <dd className="mt-1 text-sm text-slate-600">{formatDate(data.createdAt)}</dd>
      </div>
    </dl>
  );
}
