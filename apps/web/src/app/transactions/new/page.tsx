import Link from 'next/link';

import { CreateTransactionForm } from '../../../components/create-transaction-form';

export default function NewTransactionPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/" className="text-sm text-slate-600 underline">
        Voltar à listagem
      </Link>
      <h1 className="mb-8 mt-4 text-2xl font-semibold tracking-tight">Nova transação</h1>
      <CreateTransactionForm />
    </main>
  );
}
