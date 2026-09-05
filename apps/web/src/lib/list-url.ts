export type TransactionStatusFilter = 'pending' | 'approved' | 'rejected';

export type ListFilters = {
  page: number;
  pageSize: number;
  status?: TransactionStatusFilter;
  transferTypeId?: number;
  from?: string;
  to?: string;
};

export function buildListUrl(baseUrl: string, filters: ListFilters): string {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('pageSize', String(filters.pageSize));

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.transferTypeId) {
    params.set('transferTypeId', String(filters.transferTypeId));
  }

  if (filters.from) {
    params.set('from', filters.from);
  }

  if (filters.to) {
    params.set('to', filters.to);
  }

  return `${baseUrl}/transactions?${params.toString()}`;
}
