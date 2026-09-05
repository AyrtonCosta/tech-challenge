import { render, screen } from '@testing-library/react';

import { TransactionDetailView } from './transaction-detail-view';

describe('TransactionDetailView', () => {
  it('mostra carregando', () => {
    render(<TransactionDetailView state="loading" data={null} />);
    expect(screen.getByText('Carregando transação…')).toBeTruthy();
  });

  it('mostra nao encontrada', () => {
    render(<TransactionDetailView state="not-found" data={null} />);
    expect(screen.getByText('Transação não encontrada.')).toBeTruthy();
  });

  it('mostra erro', () => {
    render(<TransactionDetailView state="error" data={null} />);
    expect(screen.getByText('Não foi possível carregar a transação.')).toBeTruthy();
  });
});
