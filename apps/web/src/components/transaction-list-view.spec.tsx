import { render, screen } from '@testing-library/react';

import { TransactionListView } from './transaction-list-view';

describe('TransactionListView', () => {
  it('mostra carregando', () => {
    render(<TransactionListView state="loading" data={null} />);
    expect(screen.getByText('Carregando transações…')).toBeTruthy();
  });

  it('mostra erro', () => {
    render(<TransactionListView state="error" data={null} />);
    expect(screen.getByText('Não foi possível carregar as transações.')).toBeTruthy();
  });

  it('mostra lista vazia', () => {
    render(<TransactionListView state="empty" data={null} />);
    expect(screen.getByText('Nenhuma transação encontrada.')).toBeTruthy();
  });
});
