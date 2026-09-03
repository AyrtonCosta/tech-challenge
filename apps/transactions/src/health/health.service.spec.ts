import { ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

const buildService = (queryRaw: jest.Mock): HealthService =>
  new HealthService({ $queryRaw: queryRaw } as unknown as PrismaService);

describe('HealthService', () => {
  it('reporta o banco como disponivel quando a consulta responde', async () => {
    const service = buildService(jest.fn().mockResolvedValue([{ '1': 1 }]));

    await expect(service.check()).resolves.toEqual({ status: 'ok', database: 'up' });
  });

  it('sinaliza indisponibilidade quando o banco recusa a conexao', async () => {
    const service = buildService(jest.fn().mockRejectedValue(new Error('connection refused')));

    await expect(service.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
