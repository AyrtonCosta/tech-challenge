'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createTransactionFormSchema } from '../lib/create-transaction.schema';
import { createTransaction } from '../lib/transactions-api';

type FieldErrors = Partial<
  Record<'accountExternalIdDebit' | 'accountExternalIdCredit' | 'transferTypeId' | 'value', string>
>;

export function CreateTransactionForm() {
  const router = useRouter();
  const [accountExternalIdDebit, setAccountExternalIdDebit] = useState('');
  const [accountExternalIdCredit, setAccountExternalIdCredit] = useState('');
  const [transferTypeId, setTransferTypeId] = useState('1');
  const [value, setValue] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitError(false);

    const parsed = createTransactionFormSchema.safeParse({
      accountExternalIdDebit,
      accountExternalIdCredit,
      transferTypeId,
      value,
    });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          key === 'accountExternalIdDebit' ||
          key === 'accountExternalIdCredit' ||
          key === 'transferTypeId' ||
          key === 'value'
        ) {
          nextErrors[key] = 'Valor inválido';
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const created = await createTransaction(parsed.data);
      router.push(`/transactions/${created.transactionExternalId}`);
    } catch {
      setSubmitError(true);
      setSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={(event) => void onSubmit(event)}
    >
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Conta débito
        <input
          className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 font-mono text-sm font-normal"
          value={accountExternalIdDebit}
          onChange={(event) => setAccountExternalIdDebit(event.target.value)}
        />
        {fieldErrors.accountExternalIdDebit ? (
          <span className="font-normal text-rose-700">{fieldErrors.accountExternalIdDebit}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Conta crédito
        <input
          className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 font-mono text-sm font-normal"
          value={accountExternalIdCredit}
          onChange={(event) => setAccountExternalIdCredit(event.target.value)}
        />
        {fieldErrors.accountExternalIdCredit ? (
          <span className="font-normal text-rose-700">{fieldErrors.accountExternalIdCredit}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Tipo
        <select
          className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal"
          value={transferTypeId}
          onChange={(event) => setTransferTypeId(event.target.value)}
        >
          <option value="1">Transferência</option>
          <option value="2">Depósito</option>
          <option value="3">Saque</option>
        </select>
        {fieldErrors.transferTypeId ? (
          <span className="font-normal text-rose-700">{fieldErrors.transferTypeId}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Valor
        <input
          className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal"
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        {fieldErrors.value ? (
          <span className="font-normal text-rose-700">{fieldErrors.value}</span>
        ) : null}
      </label>

      {submitError ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          Não foi possível criar a transação.
        </p>
      ) : null}

      <button
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 sm:w-auto"
        type="submit"
        disabled={submitting}
      >
        {submitting ? 'Criando…' : 'Criar transação'}
      </button>
    </form>
  );
}
