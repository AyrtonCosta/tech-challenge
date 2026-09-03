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

export const toStoredStatus = (status: ContractStatus): StoredStatus => {
  const stored = CONTRACT_TO_STORED[status];

  if (!stored) {
    throw new Error(`Status de contrato desconhecido: ${status}`);
  }

  return stored;
};

export const toContractStatus = (status: StoredStatus): ContractStatus => {
  const contract = STORED_TO_CONTRACT[status];

  if (!contract) {
    throw new Error(`Status persistido desconhecido: ${status}`);
  }

  return contract;
};
