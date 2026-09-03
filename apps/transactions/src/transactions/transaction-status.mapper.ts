import type { TransactionStatus as ContractStatus } from '@tech-challenge/contracts';

import type { TransactionStatus as StoredStatus } from '../generated/prisma/enums';

/**
 * O contrato publico (API e eventos) usa minusculas; a coluna do Postgres usa o
 * enum em maiusculas. Os dois `Record` completos forcam o compilador a apontar
 * qualquer status novo que entre em um lado e nao no outro.
 */
const CONTRACT_TO_STORED: Record<ContractStatus, StoredStatus> = {
  pending: 'PENDING',
  approved: 'APPROVED',
  rejected: 'REJECTED',
};

const STORED_TO_CONTRACT: Record<StoredStatus, ContractStatus> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const toStoredStatus = (status: ContractStatus): StoredStatus => CONTRACT_TO_STORED[status];

export const toContractStatus = (status: StoredStatus): ContractStatus =>
  STORED_TO_CONTRACT[status];
