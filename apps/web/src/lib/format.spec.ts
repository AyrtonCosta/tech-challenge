import {
  dateInputToIsoEnd,
  dateInputToIsoStart,
  formatBRL,
  formatDate,
  formatTypeName,
} from './format';

describe('format', () => {
  it('traduz o tipo de transferencia', () => {
    expect(formatTypeName('TRANSFER')).toBe('Transferência');
    expect(formatTypeName('DEPOSIT')).toBe('Depósito');
    expect(formatTypeName('WITHDRAWAL')).toBe('Saque');
  });

  it('formata valor em real', () => {
    expect(formatBRL(1500).replace(/\u00a0/g, ' ')).toBe('R$ 1.500,00');
  });

  it('formata data so com dia mes e ano', () => {
    expect(formatDate('2026-09-04T17:46:55.904Z')).toBe('04/09/2026');
  });

  it('converte o dia do filtro para o inicio e o fim em ISO', () => {
    expect(dateInputToIsoStart('2026-09-04')).toBe(new Date('2026-09-04T00:00:00').toISOString());
    expect(dateInputToIsoEnd('2026-09-04')).toBe(new Date('2026-09-04T23:59:59.999').toISOString());
  });
});
