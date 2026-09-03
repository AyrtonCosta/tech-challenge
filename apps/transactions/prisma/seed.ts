import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { resolve } from 'node:path';

import { PrismaClient } from '../src/generated/prisma/client';

config({ path: resolve(__dirname, '../../..', '.env') });

const TRANSFER_TYPES = [
  { id: 1, name: 'TRANSFER' },
  { id: 2, name: 'DEPOSIT' },
  { id: 3, name: 'WITHDRAWAL' },
];

async function seed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL nao definida. Copie .env.example para .env antes de semear.');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    for (const transferType of TRANSFER_TYPES) {
      await prisma.transactionType.upsert({
        where: { id: transferType.id },
        update: { name: transferType.name },
        create: transferType,
      });
    }

    console.log(`Tipos de transferencia semeados: ${TRANSFER_TYPES.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
