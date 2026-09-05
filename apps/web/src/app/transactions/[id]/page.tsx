import Link from 'next/link';

import { TransactionDetail } from '../../../components/transaction-detail';

type TransactionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransactionPage({ params }: TransactionPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/" className="text-sm text-slate-600 underline">
        Voltar à listagem
      </Link>
      <h1 className="mb-8 mt-4 text-2xl font-semibold tracking-tight">Detalhe</h1>
      <TransactionDetail transactionExternalId={id} />
    </main>
  );
}
