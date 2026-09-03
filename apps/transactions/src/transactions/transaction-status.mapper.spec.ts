import {
  TRANSACTION_STATUSES,
  type TransactionStatus as ContractStatus,
} from '@tech-challenge/contracts';

import { TransactionStatus as StoredStatus } from '../generated/prisma/enums';
import { toContractStatus, toStoredStatus } from './transaction-status.mapper';

describe('mapeamento de status da transacao', () => {
  it.each([...TRANSACTION_STATUSES])(
    'converte "%s" do contrato para o banco e de volta',
    (status: ContractStatus) => {
      expect(toContractStatus(toStoredStatus(status))).toBe(status);
    },
  );

  it.each([...Object.values(StoredStatus)])(
    'converte "%s" do banco para o contrato e de volta',
    (status: StoredStatus) => {
      expect(toStoredStatus(toContractStatus(status))).toBe(status);
    },
  );

  it('cobre todos os status do enum do banco', () => {
    expect(Object.values(StoredStatus)).toHaveLength(TRANSACTION_STATUSES.length);
  });
});
