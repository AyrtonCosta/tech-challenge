import { buildListUrl } from './list-url';

describe('buildListUrl', () => {
  it('sempre envia page e pageSize', () => {
    expect(buildListUrl('http://localhost:3001', { page: 2, pageSize: 10 })).toBe(
      'http://localhost:3001/transactions?page=2&pageSize=10',
    );
  });

  it('omite filtro vazio', () => {
    const url = buildListUrl('http://localhost:3001', {
      page: 1,
      pageSize: 10,
      status: 'rejected',
    });

    expect(url).toContain('status=rejected');
    expect(url).not.toContain('transferTypeId');
  });
});
