import { createTransactionFormSchema } from './create-transaction.schema';

const VALID = {
  accountExternalIdDebit: '11111111-1111-1111-1111-111111111111',
  accountExternalIdCredit: '22222222-2222-2222-2222-222222222222',
  transferTypeId: '1',
  value: '120',
};

describe('createTransactionFormSchema', () => {
  it('aceita o payload do enunciado', () => {
    expect(createTransactionFormSchema.parse(VALID)).toEqual({
      accountExternalIdDebit: VALID.accountExternalIdDebit,
      accountExternalIdCredit: VALID.accountExternalIdCredit,
      transferTypeId: 1,
      value: 120,
    });
  });

  it('recusa conta que nao e uuid', () => {
    const parsed = createTransactionFormSchema.safeParse({
      ...VALID,
      accountExternalIdDebit: 'nao-e-uuid',
    });

    expect(parsed.success).toBe(false);
  });

  it('recusa valor zero', () => {
    const parsed = createTransactionFormSchema.safeParse({ ...VALID, value: '0' });
    expect(parsed.success).toBe(false);
  });
});
