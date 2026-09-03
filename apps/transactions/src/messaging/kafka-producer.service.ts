import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, type Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly producer: Producer;

  constructor(config: ConfigService) {
    const kafka = new Kafka({
      clientId: config.get<string>('KAFKA_CLIENT_ID') ?? 'tech-challenge',
      brokers: config.getOrThrow<string>('KAFKA_BROKERS').split(','),
    });

    this.producer = kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(topic: string, key: string, payload: unknown): Promise<void> {
    await this.producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(payload) }],
    });
  }
}
