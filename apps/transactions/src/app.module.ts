import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';

import { HealthModule } from './health/health.module';
import { TransactionsModule } from './transactions/transactions.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, '../../..', '.env'),
    }),
    HealthModule,
    TransactionsModule,
    MessagingModule,
  ],
})
export class AppModule {}
