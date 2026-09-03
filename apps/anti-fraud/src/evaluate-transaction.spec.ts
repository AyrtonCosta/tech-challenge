import { evaluateTransaction } from './evaluate-transaction';

describe('evaluateTransaction', () => {
  it('aprova valor abaixo do limite', () => {
    expect(evaluateTransaction(999.99)).toBe('approved');
  });

  it('aprova o limite exato', () => {
    expect(evaluateTransaction(1000)).toBe('approved');
  });

  it('rejeita o primeiro centavo acima do limite', () => {
    expect(evaluateTransaction(1000.01)).toBe('rejected');
  });
});
