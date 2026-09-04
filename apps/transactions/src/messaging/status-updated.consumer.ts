import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TOPICS } from '@tech-challenge/contracts';
import { Kafka, type Consumer } from 'kafkajs';

import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class StatusUpdatedConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StatusUpdatedConsumer.name);
  private readonly consumer: Consumer;

  constructor(
    config: ConfigService,
    private readonly transactions: TransactionsService,
  ) {
    const kafka = new Kafka({
      clientId: config.get<string>('KAFKA_CLIENT_ID') ?? 'tech-challenge',
      brokers: config.getOrThrow<string>('KAFKA_BROKERS').split(','),
    });

    this.consumer = kafka.consumer({
      groupId: config.getOrThrow<string>('KAFKA_GROUP_ID_TRANSACTIONS'),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: TOPICS.TRANSACTION_STATUS_UPDATED });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          await this.handleMessage(message.value);
        } catch (error) {
          this.logger.error(
            'Mensagem de status invalida ou falha ao gravar',
            error instanceof Error ? error.stack : undefined,
          );
        }
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  async handleMessage(value: Buffer | null): Promise<void> {
    if (!value) {
      return;
    }

    const payload: unknown = JSON.parse(value.toString());
    await this.transactions.applyStatusUpdate(payload);
  }
}
