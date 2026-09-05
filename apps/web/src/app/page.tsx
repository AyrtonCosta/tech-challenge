import Link from 'next/link';

import { TransactionList } from '../components/transaction-list';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
        <Link
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white sm:w-auto"
          href="/transactions/new"
        >
          Nova transação
        </Link>
      </div>
      <TransactionList />
    </main>
  );
}
