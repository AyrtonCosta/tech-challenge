import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TOPICS } from '@tech-challenge/contracts';
import { Kafka, type Consumer, type Producer } from 'kafkajs';

import { applyCreatedEvent } from './apply-created-event';

@Injectable()
export class CreatedEventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CreatedEventConsumer.name);
  private readonly producer: Producer;
  private readonly consumer: Consumer;

  constructor(config: ConfigService) {
    const kafka = new Kafka({
      clientId: config.get<string>('KAFKA_CLIENT_ID') ?? 'tech-challenge',
      brokers: config.getOrThrow<string>('KAFKA_BROKERS').split(','),
    });

    this.producer = kafka.producer();
    this.consumer = kafka.consumer({
      groupId: config.getOrThrow<string>('KAFKA_GROUP_ID_ANTI_FRAUD'),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: TOPICS.TRANSACTION_CREATED });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) {
          return;
        }

        try {
          const payload: unknown = JSON.parse(message.value.toString());
          const result = applyCreatedEvent(payload);

          await this.producer.send({
            topic: TOPICS.TRANSACTION_STATUS_UPDATED,
            messages: [
              {
                key: result.data.transactionExternalId,
                value: JSON.stringify(result),
              },
            ],
          });
        } catch (error) {
          this.logger.error(
            'Mensagem de criacao invalida ou falha ao publicar o resultado',
            error instanceof Error ? error.stack : undefined,
          );
        }
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}
